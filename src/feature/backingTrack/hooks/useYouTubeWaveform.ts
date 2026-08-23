import { useCallback, useEffect, useRef, useState } from "react";

import type { CaptureBatch, TabAudioCapture } from "../services/tabAudioCapture";
import {
  acquireTabAudioCapture,
  isTabAudioCaptureSupported,
  peekTabAudioCapture,
  releaseTabAudioCapture,
  TabAudioCaptureError,
} from "../services/tabAudioCapture";
import { readWaveform, WAVEFORM_SCHEMA, writeWaveform } from "../services/waveformCache";
import type { PeakBuilder, PeakBuilderRestore } from "../utils/peakBuilder";
import {
  createOnsetDetector,
  createPeakBuilder,
  packPeaks,
  unpackPeaks,
  unpackSeen,
} from "../utils/peakBuilder";
import type { VideoClock } from "../utils/videoClock";
import { createVideoClock } from "../utils/videoClock";
import { PEAKS_PER_SECOND } from "./useWaveformPeaks";

/** Enough resolution to see an attack; matches what a decoded file produces. */
const BUCKETS_PER_SECOND = PEAKS_PER_SECOND;

/** How often the player is asked where it is. Its own answer only firms up a
 *  few times a second, and the clock fits a line through the readings anyway. */
const CLOCK_POLL_MS = 200;

/** How often the growing waveform is pushed to React while somebody is looking
 *  at it. Redrawing 120 buckets a second would repaint the screen for no gain. */
const PUBLISH_INTERVAL_MS = 250;

/**
 * How often it is pushed when nobody is.
 *
 * Each push copies both channels out of the builder — for a four-minute video
 * that is a third of a megabyte a time, and listening now runs for the whole
 * practice session rather than for as long as a screen is open. At the watched
 * rate that is well over a megabyte a second of garbage thrown off behind a
 * player who is trying to play guitar to a real-time audio path.
 */
const IDLE_PUBLISH_INTERVAL_MS = 3_000;

/** How often a pass in progress is written down, so a crash or a hard quit
 *  costs a few seconds of listening rather than the whole play-through. */
const PERSIST_INTERVAL_MS = 20_000;

/** Coverage past which there is nothing left worth listening for. Never quite 1:
 *  the last buckets of a video are usually silence the player never reaches. */
const COVERAGE_DONE = 0.985;

/** A stored pass recorded through a materially different path than the current
 *  one has to be shifted onto this one before the two are blended. */
const LATENCY_DRIFT_TOLERANCE_MS = 4;

export type YouTubeWaveformStatus =
  /** No video, or this browser can't hand over audio (Firefox, Safari, mobile). */
  | "unsupported"
  /** Nothing is being listened to — either nothing has been asked for yet, or
   *  the whole video has already been heard. */
  | "idle"
  /** Listening — the waveform is filling in as the video plays. */
  | "listening"
  | "error";

export interface YouTubeWaveform {
  status: YouTubeWaveformStatus;
  /** The body of the wave. */
  peaks: Float32Array | null;
  /** Attack strength on the same grid — what a downbeat is actually visible in. */
  onsets: Float32Array | null;
  peaksPerSecond: number;
  durationSec: number;
  /** 0..1 of the video heard so far. Below 1 the waveform has gaps. */
  coverage: number;
  /** Nothing left worth listening for. Never quite full coverage: the last
   *  buckets of a video are usually silence the player never reaches. */
  isComplete: boolean;
  /**
   * Bumped whenever the waveform's contents changed.
   *
   * The picture is expensive enough to draw that consumers cache the bitmap, and
   * a waveform being filled in changes its contents without changing its length
   * — so there has to be something for a cache key to notice.
   */
  revision: number;
  /**
   * Measured delay between audio leaving the tab and reaching the analysis, in
   * ms, or null when it could not be measured. Everything heard is corrected by
   * it; without it the whole waveform sits late by this much.
   */
  latencyMs: number | null;
  error: string | null;
  /** Starts listening. On the web the first call must come from a click — the
   *  platform only grants capture off a user gesture. */
  start: () => void;
  /** Stops listening and keeps what was learned. */
  stop: () => void;
  /**
   * Says a screen is drawing this, and returns the release. While nobody is,
   * the waveform is still learned — it is just handed over far less often, and
   * handing it over is what costs anything. Call from an effect.
   */
  watch: () => () => void;
}

/** What has been learned, and which video it belongs to. */
interface Learned {
  videoId: string;
  peaks: Float32Array | null;
  onsets: Float32Array | null;
  durationSec: number;
  coverage: number;
  revision: number;
}

/** One reading of the embedded player, as the session hands it over. */
export interface YouTubeClockReading {
  currentTime: number;
  duration: number;
  /** What the player was told to run at, which the clock refines by observation. */
  rate: number;
  /** False for paused, buffering, unstarted — and for ads, whose timeline
   *  belongs to a different recording entirely. */
  isPlaying: boolean;
}

/**
 * The desktop build answers the capture request in its own main process, so
 * starting to listen there costs nothing and shows nothing. In a browser it
 * costs a permission prompt, and putting one of those in front of somebody who
 * did not ask for it is not on — there, listening waits for a click.
 */
function canListenWithoutAsking(): boolean {
  return typeof window !== "undefined" && !!window.electronWindow;
}

/**
 * Remembers, for the life of the page, that listening was turned off by hand.
 *
 * Module scope rather than state because the point is to survive the hook
 * remounting: without it, closing the Align screen would re-arm the very thing
 * that was just switched off.
 */
let listeningDeclined = false;

/** Slides a stored pass along the grid, dropping whatever falls off the end. */
function shiftRestore(restore: PeakBuilderRestore, buckets: number): PeakBuilderRestore {
  if (buckets === 0) return restore;
  const length = restore.peaks.length;
  const peaks = new Float32Array(length);
  const seen = new Uint8Array(length);
  const onsets = new Float32Array(length);

  for (let i = 0; i < length; i += 1) {
    const from = i + buckets;
    if (from < 0 || from >= length) continue;
    peaks[i] = restore.peaks[from];
    seen[i] = restore.seen[from];
    onsets[i] = restore.onsets?.[from] ?? 0;
  }

  return { peaks, seen, onsets };
}

/**
 * Learns a YouTube video's waveform by listening to it play.
 *
 * A video's audio lives in a cross-origin iframe, so its samples cannot be read
 * from the page and the recording cannot be decoded ahead of time — this source
 * has always had to be aligned by ear. Capturing what is already being played to
 * the user is the one route the platform offers: nothing is downloaded and
 * nothing about how YouTube delivers the video is worked around.
 *
 * Three things make the result trustworthy where the first attempt at this was
 * not:
 *
 * The audio is measured on the audio thread, block by block, so a tab that is
 * not in front still hears everything — animation frames are throttled to a
 * crawl in the background, and every one they miss used to be painted flat
 * across the gap and then marked as heard, so no later pass would fix it.
 *
 * What is heard is filed under the *video's* clock, fitted from the player's own
 * answers rather than taken raw, so the steps in those answers average out
 * instead of bunching the audio onto them. Filing by the video's clock is also
 * what lets a pass at double speed, a pause, or a second run over the chorus all
 * land in the right buckets.
 *
 * And the capture's own delay is measured and subtracted. Audio reaches the
 * analysis a tenth of a second or so after the player says it played; ignoring
 * that shifted the entire waveform late, and aligning a tab against a waveform
 * that is late puts the backing track out by the same amount.
 *
 * Mounted by the backing-track session rather than by the Align screen, so a
 * video that plays during ordinary practice is heard as it plays and the
 * waveform is simply there by the time anyone comes to align it.
 */
export function useYouTubeWaveform(params: {
  videoId: string | null;
  /** Where the video is and what it is doing — the clock everything is filed under. */
  getClock: () => YouTubeClockReading | null;
  /** False when there is no video in play, so nothing listens needlessly. */
  enabled: boolean;
}): YouTubeWaveform {
  const { videoId, getClock, enabled } = params;

  // Keyed by video so switching one out can never show the previous one's
  // waveform, and so nothing has to be reset synchronously in an effect.
  const [learned, setLearned] = useState<Learned | null>(null);
  const [isListening, setListening] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Bumped by `start`, which is how a click reaches the listening effect. */
  const [startKey, setStartKey] = useState(0);

  const builderRef = useRef<PeakBuilder | null>(null);
  // What a previous session learned, so a fresh pass fills the gaps in it rather
  // than painting the picture again from nothing.
  const restoreRef = useRef<PeakBuilderRestore | null>(null);
  /** Latency the restored pass was recorded through, so this one can be told
   *  apart from it rather than blended into it blindly. */
  const restoredLatencyRef = useRef<number | null>(null);
  /** Coverage that was loaded, as a floor no write is allowed to fall below. */
  const restoredCoverageRef = useRef(0);
  const clockRef = useRef<VideoClock | null>(null);
  const onsetRef = useRef(createOnsetDetector());
  const latencyRef = useRef<number | null>(null);
  const revisionRef = useRef(0);
  /** How many screens are drawing the waveform right now — see `watch`. A ref
   *  because nothing renders from it; it only sets a cadence. */
  const watchersRef = useRef(0);

  const watch = useCallback(() => {
    watchersRef.current += 1;
    return () => {
      watchersRef.current = Math.max(0, watchersRef.current - 1);
    };
  }, []);

  const getClockRef = useRef(getClock);
  useEffect(() => {
    getClockRef.current = getClock;
  }, [getClock]);

  const supported = isTabAudioCaptureSupported();

  /**
   * Writes whatever has been heard for one video.
   *
   * Takes the id rather than reading it from the closure so the cleanup that
   * runs *because* the video changed still files what was heard under the
   * outgoing one. A play-through is far too expensive to lose to that.
   */
  const persistFor = useCallback((id: string | null) => {
    const builder = builderRef.current;
    // Nothing heard means nothing worth writing — and writing it would stamp an
    // empty waveform over a good one from a previous session.
    if (!builder || !id || builder.coverage() <= 0) return;
    // Neither is going backwards allowed. A pass only ever adds to what it
    // resumed, so less coverage than was loaded means the resume did not take,
    // and writing that would trade a play-through for whatever this run heard.
    if (builder.coverage() < restoredCoverageRef.current) return;

    const seen = builder.seenMask();
    const scales = builder.scales();
    void writeWaveform({
      videoId: id,
      peaks: packPeaks(builder.snapshot(), seen),
      onsets: packPeaks(builder.onsetSnapshot(), seen),
      peakScale: scales.peak,
      onsetScale: scales.onset,
      durationSec: builder.durationSec,
      bucketsPerSecond: builder.bucketsPerSecond,
      coverage: builder.coverage(),
      latencyMs: latencyRef.current,
      schema: WAVEFORM_SCHEMA,
      updatedAt: Date.now(),
    });
  }, []);

  const publish = useCallback((id: string) => {
    const builder = builderRef.current;
    if (!builder) return;
    revisionRef.current += 1;
    setLearned({
      videoId: id,
      peaks: builder.snapshot(),
      onsets: builder.onsetSnapshot(),
      durationSec: builder.durationSec,
      coverage: builder.coverage(),
      revision: revisionRef.current,
    });
  }, []);

  const stop = useCallback(() => {
    listeningDeclined = true;
    releaseTabAudioCapture();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    listeningDeclined = false;
    setError(null);
    // Bumped rather than acted on: the listening effect below owns every path
    // that opens a capture, so opening, attaching and tearing down stay in one
    // place. The permission prompt still goes up — transient activation outlives
    // the click by several seconds, comfortably longer than an effect takes.
    setStartKey((key) => key + 1);
  }, []);

  // The capture is shared and outlives any one video, so it is only handed back
  // when the session that wanted it is over. Releasing it on every video change
  // would ask a browser for permission again on the next one.
  useEffect(() => () => releaseTabAudioCapture(), []);

  // ── Load what a previous visit learned ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    builderRef.current = null;
    restoreRef.current = null;
    restoredLatencyRef.current = null;
    restoredCoverageRef.current = 0;
    clockRef.current = createVideoClock();
    onsetRef.current.reset();

    if (!videoId || !supported) {
      return () => {
        cancelled = true;
      };
    }

    void readWaveform(videoId).then((stored) => {
      if (cancelled || !stored) return;
      // Measured on another grid, so its buckets would not line up with ours.
      if (stored.bucketsPerSecond !== BUCKETS_PER_SECOND) return;

      const peaks = unpackPeaks(stored.peaks);
      const seen = unpackSeen(stored.peaks);
      const onsets = stored.onsets ? unpackPeaks(stored.onsets) : new Float32Array(peaks.length);
      restoreRef.current = {
        peaks,
        seen,
        onsets,
        peakScale: stored.peakScale,
        onsetScale: stored.onsetScale,
      };
      restoredLatencyRef.current = stored.latencyMs;
      restoredCoverageRef.current = stored.coverage;

      revisionRef.current += 1;
      setLearned({
        videoId,
        peaks,
        onsets,
        durationSec: stored.durationSec,
        coverage: stored.coverage,
        revision: revisionRef.current,
      });
    });

    // Closing the screen and swapping the video both land here, and both used
    // to discard a pass in progress. `videoId` comes from this closure, so a
    // swap still files what was heard under the video it was heard from.
    return () => {
      cancelled = true;
      persistFor(videoId);
    };
  }, [videoId, supported, persistFor]);

  // ── Listen ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoId || !supported || !enabled) return;

    let disposed = false;
    let capture: TabAudioCapture | null = null;
    let unsubscribe: (() => void) | null = null;
    let unsubscribeEnded: (() => void) | null = null;
    let clockTimer: number | null = null;
    let publishTimer: number | null = null;
    let persistTimer: number | null = null;
    let lastEpoch = -1;

    /**
     * The builder cannot exist until the player has admitted how long the video
     * is, because the length sizes the buffer. Made on the first block that has
     * a clock behind it rather than up front.
     */
    const builderFor = (durationSec: number): PeakBuilder | null => {
      if (builderRef.current) {
        if (durationSec > builderRef.current.durationSec) builderRef.current.grow(durationSec);
        return builderRef.current;
      }
      if (!(durationSec > 0)) return null;

      const restore = restoreRef.current ?? undefined;
      // A restore is only laid down when it fits, and the player's answer wanders
      // by a fraction of a second between loads — so sizing the buffer from that
      // answer alone would silently drop a whole play-through whenever the video
      // came back a hair shorter than the pass that was saved from it.
      const restoredSec = restore ? restore.peaks.length / BUCKETS_PER_SECOND : 0;
      builderRef.current = createPeakBuilder(
        Math.max(durationSec, restoredSec),
        BUCKETS_PER_SECOND,
        restore,
      );
      return builderRef.current;
    };

    const onBatch = (batch: CaptureBatch) => {
      if (disposed) return;
      const clock = clockRef.current;
      if (!clock) return;

      // Our own calibration burst, not the video's audio. Recording it would
      // put a spike into the waveform at whatever moment the song was at.
      if (batch.suppressed) {
        onsetRef.current.reset();
        return;
      }

      // A seek, a stall or an ad ended the continuous run; the previous block
      // is no longer the previous moment of the recording.
      if (clock.epoch() !== lastEpoch) {
        lastEpoch = clock.epoch();
        onsetRef.current.reset();
      }

      const builder = builderFor(clock.durationSec());
      const latency = latencyRef.current ?? 0;
      const rate = clock.observedRate();

      for (let i = 0; i < batch.peak.length; i += 1) {
        const attack = onsetRef.current.push(batch.hp[i]);
        if (!builder) continue;

        const heardAtMs = capture
          ? capture.toPerformanceMs(batch.startTime + i * batch.blockDuration) - latency
          : null;
        const videoSec = heardAtMs === null ? null : clock.at(heardAtMs);
        if (videoSec === null) {
          // Nothing trustworthy to file this under. Left unheard on purpose:
          // a gap is honest and a later pass will fill it, where a guess would
          // be marked heard and never revisited.
          onsetRef.current.reset();
          continue;
        }

        // A block covers a span of the recording, and more of it the faster the
        // video is running. Filed as the span it was rather than as an instant,
        // so nothing falls between two blocks.
        builder.observeSpan(videoSec, videoSec + batch.blockDuration * rate, batch.peak[i], attack);
      }
    };

    /**
     * Adopts a latency, and brings a pass recorded through a different one onto
     * the same footing before the two are blended.
     *
     * Two halves of a waveform recorded at two latencies is exactly the failure
     * that reads as "it was right, and then it drifted": each half is internally
     * consistent and they disagree with each other.
     */
    const applyLatency = (measured: number | null) => {
      latencyRef.current = measured;
      setLatencyMs(measured);

      const restore = restoreRef.current;
      const before = restoredLatencyRef.current;
      if (!restore || before === null || measured === null) return;

      const shiftMs = measured - before;
      if (Math.abs(shiftMs) < LATENCY_DRIFT_TOLERANCE_MS) return;
      // The old pass was filed late by however much its latency undershot this
      // one, so it slides by the difference — the same picture, on this frame.
      const shifted = shiftRestore(restore, Math.round((shiftMs / 1000) * BUCKETS_PER_SECOND));
      restoreRef.current = shifted;
      restoredLatencyRef.current = measured;
      // Only matters before the builder exists; once it does, the shift would
      // have to be applied to what it already holds, and starting the pass over
      // is not worth a few milliseconds.
      if (!builderRef.current) return;
      builderRef.current = createPeakBuilder(
        builderRef.current.durationSec,
        BUCKETS_PER_SECOND,
        shifted,
      );
    };

    /** Attaches to a capture, and starts everything that depends on having one. */
    const attach = async (opened: TabAudioCapture) => {
      if (disposed) return;
      capture = opened;
      setListening(true);
      setError(null);

      unsubscribe = opened.subscribe(onBatch);
      unsubscribeEnded = opened.onEnded(() => {
        if (disposed) return;
        setListening(false);
        capture = null;
      });

      // Latency is a property of the capture, not of the video, so it is
      // measured once per capture and every video afterwards inherits it.
      const known = opened.latencySec;
      if (known !== null) {
        applyLatency(known * 1000);
      } else {
        const measured = await opened.calibrate();
        if (disposed) return;
        applyLatency(measured === null ? null : measured * 1000);
      }
    };

    // Reading the player is the one thing that has to happen on the main thread,
    // and it happens far more often than the player's own answer changes so the
    // clock has a line to fit rather than a staircase to follow.
    clockTimer = window.setInterval(() => {
      const reading = getClockRef.current();
      if (!reading) return;
      clockRef.current?.sample(
        {
          currentTime: reading.currentTime,
          durationSec: reading.duration,
          rate: reading.rate,
          isPlaying: reading.isPlaying,
        },
        performance.now(),
      );
    }, CLOCK_POLL_MS);

    let publishedAt = 0;
    publishTimer = window.setInterval(() => {
      if (!builderRef.current) return;
      const now = Date.now();
      if (watchersRef.current === 0 && now - publishedAt < IDLE_PUBLISH_INTERVAL_MS) return;
      publishedAt = now;
      publish(videoId);
    }, PUBLISH_INTERVAL_MS);

    persistTimer = window.setInterval(() => persistFor(videoId), PERSIST_INTERVAL_MS);

    // Already sharing — attach with no prompt and no ceremony, whatever build
    // this is. This is what makes the second video free.
    const open = peekTabAudioCapture();
    if (open) {
      void attach(open);
    } else if (!listeningDeclined && (canListenWithoutAsking() || startKey > 0)) {
      // Either nothing will be asked, or somebody just clicked and asking is
      // exactly what they asked for.
      void acquireTabAudioCapture()
        .then(attach)
        .catch((reason) => {
          if (disposed) return;
          setError(
            reason instanceof TabAudioCaptureError
              ? reason.message
              : "Couldn't start listening to this tab.",
          );
        });
    }

    return () => {
      disposed = true;
      if (clockTimer !== null) window.clearInterval(clockTimer);
      if (publishTimer !== null) window.clearInterval(publishTimer);
      if (persistTimer !== null) window.clearInterval(persistTimer);
      unsubscribe?.();
      unsubscribeEnded?.();
      persistFor(videoId);
    };
  }, [videoId, supported, enabled, startKey, persistFor, publish]);

  // Nothing left to hear. The capture stays open — it is shared, and the next
  // video is free only because it was not handed back.
  const current = learned?.videoId === videoId ? learned : null;
  const coverage = current?.coverage ?? 0;
  const done = coverage >= COVERAGE_DONE;

  const status: YouTubeWaveformStatus = !supported || !videoId
    ? "unsupported"
    : error
      ? "error"
      : isListening && !done
        ? "listening"
        : "idle";

  return {
    status,
    peaks: current?.peaks ?? null,
    onsets: current?.onsets ?? null,
    peaksPerSecond: BUCKETS_PER_SECOND,
    durationSec: current?.durationSec ?? 0,
    coverage,
    isComplete: done,
    revision: current?.revision ?? 0,
    latencyMs,
    error,
    start,
    stop,
    watch,
  };
}
