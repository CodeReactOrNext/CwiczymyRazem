import { onOutputDeviceChange, readPersistedOutputDeviceId } from "hooks/useNativeOutputDevice";
import type { MutableRefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { applyMediaElementSinkId } from "utils/applyAudioSinkId";

import type { ScoreClock } from "../utils/backingSync";
import {
  beatsSinceStart,
  clampPlaybackRate,
  resolveDrift,
  STARTUP_SEEK_THRESHOLD_SEC,
  syncRateFor,
} from "../utils/backingSync";
import type { RecordingTempoMap } from "../utils/tempoMap";

/** How often the stems' position is compared against the session clock. */
const CORRECTION_INTERVAL_MS = 200;

export interface PlayableStem {
  trackId: string;
  /** Object URL of the decoded file, or null while it is still being read. */
  src: string | null;
  volume: number;
  muted: boolean;
  /** This stem's own shift on top of the shared offset, in ms. */
  offsetMs: number;
}

interface UseFileStemsPlayerOptions {
  stems: PlayableStem[];
  /** True only once the count-in is over and the session is actually running. */
  isPlaying: boolean;
  /** Metronome master clock: wall-clock ms of the tab's beat 0 (back-dated on seeks). */
  startTime: number | null;
  /**
   * The session's own tempo curve, if the tab has one.
   *
   * Elapsed wall time counts warped beats, not bars of the score. Reading it as
   * bars puts the recording a beat out per bar of automation and never gets it
   * back — no offset can fix an error that grows.
   */
  scoreClockRef: MutableRefObject<ScoreClock | null>;
  /** Session tempo including the speed multiplier. */
  effectiveBpm: number;
  /**
   * Where the tab's bars sit in the recording. The recording itself is never
   * warped — it plays at one steady rate — so this only changes *which* moment
   * of it a given tab beat is chased to.
   */
  tempoMap: RecordingTempoMap;
  offsetMs: number;
  /** Master level and mute over all stems. */
  masterVolume: number;
  masterMuted: boolean;
  /** Bumped when the user moves the offset, so a nudge is audible at once. */
  realignKey: number;
}

interface FileStemsPlayerState {
  /** Live sync error in ms (positive = ahead of the tab), from the first stem.
   *  Read via ref: the loop runs 5×/s and must not re-render the session. */
  driftMsRef: MutableRefObject<number>;
  /** Longest stem, once known — the recording's length. */
  durationSec: number | null;
  error: string | null;
}

/**
 * Plays one or more stems of a recording locked to the session's beat clock.
 *
 * Media elements rather than AudioBufferSourceNodes, because `preservesPitch`
 * gives pitch-preserving time stretching for free — a buffer source would
 * transpose everything when the BPM changes.
 *
 * One correction loop drives every stem from a single computed target. Running
 * a loop per stem would let them drift against *each other*, and stems of one
 * performance sliding apart by even a few milliseconds comb-filters into an
 * audible mess — far worse than being a few ms off the tab together.
 */
export function useFileStemsPlayer({
  stems,
  isPlaying,
  startTime,
  scoreClockRef,
  effectiveBpm,
  tempoMap,
  offsetMs,
  masterVolume,
  masterMuted,
  realignKey,
}: UseFileStemsPlayerOptions): FileStemsPlayerState {
  const elementsRef = useRef(new Map<string, HTMLAudioElement>());
  const driftMsRef = useRef(0);

  const [durationSec, setDurationSec] = useState<number | null>(null);
  // Tagged with the stem set it came from, so swapping stems clears it without
  // a reset written from an effect body.
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);

  // Identity of the loaded set, so the element pool is only rebuilt when the
  // stems really change — not on every level tweak.
  const loadedKey = useMemo(
    () => stems.map((stem) => `${stem.trackId}:${stem.src ?? ""}`).join("|"),
    [stems],
  );

  const stemsRef = useRef(stems);
  useEffect(() => {
    stemsRef.current = stems;
  });

  // ── Element pool ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const elements = elementsRef.current;
    const wanted = new Set<string>();
    const outputDevice = readPersistedOutputDeviceId();

    for (const stem of stemsRef.current) {
      if (!stem.src) continue;
      wanted.add(stem.trackId);

      let el = elements.get(stem.trackId);
      if (!el) {
        el = new Audio();
        el.preload = "auto";
        // The whole point: change tempo without transposing the recording.
        el.preservesPitch = true;
        el.addEventListener("error", () =>
          setFailure({
            key: loadedKey,
            message: "One of these files could not be decoded — try a different format.",
          }),
        );
        el.addEventListener("loadedmetadata", () => {
          if (!Number.isFinite(el!.duration)) return;
          setDurationSec((longest) => Math.max(longest ?? 0, el!.duration));
        });
        elements.set(stem.trackId, el);
        applyMediaElementSinkId(el, outputDevice);
      }
      if (el.src !== stem.src) {
        el.src = stem.src;
        el.load();
      }
    }

    // Anything no longer in the set is torn down rather than left playing.
    for (const [trackId, el] of elements) {
      if (wanted.has(trackId)) continue;
      el.pause();
      el.removeAttribute("src");
      el.load();
      elements.delete(trackId);
    }

  }, [loadedKey]);

  // Everything goes when the session does.
  useEffect(() => {
    const elements = elementsRef.current;
    return () => {
      for (const el of elements.values()) {
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
      elements.clear();
    };
  }, []);

  // Follow the session's chosen output device (Electron keeps everything on the
  // same interface as ASIO capture — see useNativeOutputDevice).
  useEffect(
    () =>
      onOutputDeviceChange((id) => {
        for (const el of elementsRef.current.values()) applyMediaElementSinkId(el, id);
      }),
    [],
  );

  // ── Levels ────────────────────────────────────────────────────────────────
  // Stem level times master, so one slider rides the whole recording.
  useEffect(() => {
    for (const stem of stems) {
      const el = elementsRef.current.get(stem.trackId);
      if (!el) continue;
      el.volume = Math.min(1, Math.max(0, stem.volume * masterVolume));
      el.muted = masterMuted || stem.muted;
    }
  }, [stems, masterVolume, masterMuted]);

  // Tempo and offset are read through a ref, never through the effect's deps:
  // dragging the alignment lane changes them continuously, and a dependency
  // would tear the loop down mid-drag.
  const paramsRef = useRef({ effectiveBpm, offsetMs, tempoMap });
  useEffect(() => {
    paramsRef.current = { effectiveBpm, offsetMs, tempoMap };
  }, [effectiveBpm, offsetMs, tempoMap]);

  const alignRef = useRef<(() => void) | null>(null);
  const hasStems = stems.some((stem) => !!stem.src);

  // ── Sync loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const elements = elementsRef.current;
    if (!hasStems) return;

    if (!isPlaying || startTime === null) {
      for (const el of elements.values()) el.pause();
      driftMsRef.current = 0;
      return;
    }

    // Starting a media element costs a few tens of milliseconds that no rate
    // nudge can absorb quickly. The first correction therefore seeks on a much
    // tighter error — a discontinuity is inaudible under the first chord,
    // whereas a 50 ms flam against the tab is not.
    let isFirstCorrection = true;
    // A user-driven realign is a jump, not drift — take it in one seek.
    let forceSeek = false;

    const align = () => {
      const { effectiveBpm: bpm, tempoMap: map } = paramsRef.current;
      const beats = beatsSinceStart(Date.now(), startTime, bpm, scoreClockRef.current);
      // One base target for the recording; each stem adds its own shift below.
      const stemTarget = map.secForBeat(beats);
      // Both curves, or the target creeps away from the audio and the corrector
      // answers with a seek a second. Once the tab has been bent to follow the
      // band the two cancel and the performance plays untouched.
      const targetRate = syncRateFor({
        effectiveBpm: bpm,
        scoreRatio: scoreClockRef.current?.ratioAt(beats) ?? 1,
        recordingBpm: map.bpmAtBeat(beats),
      });

      let anyRunning = false;
      let first = true;

      for (const stem of stemsRef.current) {
        const el = elements.get(stem.trackId);
        if (!el) continue;
        // Shared target for the recording, plus whatever this one stem needs on
        // top — stems exported together carry 0 and stay locked to each other.
        const target = stemTarget + stem.offsetMs / 1000;
        // Beat 0 hasn't reached the recording yet (negative offset), or the tab
        // outran the end of this stem — either way there is nothing to play.
        if (target < 0 || (el.duration && target > el.duration)) {
          if (!el.paused) el.pause();
          continue;
        }

        const drift = el.currentTime - target;
        if (first) {
          driftMsRef.current = drift * 1000;
          first = false;
        }

        const { action, rateFactor } = resolveDrift(
          drift,
          isFirstCorrection ? STARTUP_SEEK_THRESHOLD_SEC : undefined,
        );
        if (action === "seek" || forceSeek) el.currentTime = target;
        el.playbackRate = clampPlaybackRate(targetRate * rateFactor);

        if (el.paused) {
          el.play().catch(() =>
            setFailure({
              key: loadedKey,
              message: "Playback was blocked — click anywhere in the session and retry.",
            }),
          );
        } else {
          anyRunning = true;
        }
      }

      forceSeek = false;
      // Only count corrections made against actually-running audio; before that
      // `currentTime` says nothing about how late playback will start.
      if (anyRunning) isFirstCorrection = false;
      if (stemTarget < 0) driftMsRef.current = 0;
    };

    align();
    alignRef.current = () => {
      forceSeek = true;
      align();
    };
    const id = window.setInterval(align, CORRECTION_INTERVAL_MS);

    return () => {
      window.clearInterval(id);
      alignRef.current = null;
      for (const el of elements.values()) el.pause();
    };
  }, [hasStems, loadedKey, isPlaying, startTime, scoreClockRef]);

  // Declared after the loop so alignRef is already pointing at the live closure,
  // and after the params effect so it reads the offset the user just set.
  useEffect(() => {
    alignRef.current?.();
  }, [realignKey]);

  return {
    driftMsRef,
    // Both belong to the stems currently loaded; an old set's answers are stale.
    durationSec: hasStems ? durationSec : null,
    error: failure?.key === loadedKey ? failure.message : null,
  };
}
