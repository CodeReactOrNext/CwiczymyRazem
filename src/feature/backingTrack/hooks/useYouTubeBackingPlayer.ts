import type { MutableRefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ScoreClock } from "../utils/backingSync";
import {
  beatsSinceStart,
  canYouTubeFollow,
  playbackRateFor,
  resolveYouTubeRate,
  YOUTUBE_FALLBACK_RATES,
} from "../utils/backingSync";
import type { RecordingTempoMap } from "../utils/tempoMap";
import type { YouTubeClockReading } from "./useYouTubeWaveform";

/** Minimal slice of the IFrame API this hook drives. */
interface YouTubePlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  /** Video dependent per the IFrame API docs, so it has to be asked for. */
  getAvailablePlaybackRates?: () => number[];
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  /** Zero until the video has loaded enough to know its own length. */
  getDuration?: () => number;
  /** 1 while playing — see the IFrame API's PlayerState. */
  getPlayerState?: () => number;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
}

// Seeking a YouTube player is audible and costs a buffering round-trip, so the
// loop runs slower and tolerates far more error than the local-file one, which
// can nudge its rate instead.
const CORRECTION_INTERVAL_MS = 1000;
const SEEK_THRESHOLD_SEC = 0.4;

/** PlayerState.PLAYING, from the IFrame API. */
const YOUTUBE_STATE_PLAYING = 1;

/** A reported length below this fraction of the longest one seen belongs to
 *  something else on the player's timeline — an ad, almost always. */
const AD_DURATION_RATIO = 0.9;

interface UseYouTubeBackingPlayerOptions {
  videoId: string | null;
  isPlaying: boolean;
  startTime: number | null;
  /**
   * The session's tempo curve — see the same option on the file player.
   *
   * The video's rate cannot follow it (the player only offers a fixed set of
   * rates), but the *position* must: without this the loop chases the wrong bar
   * of the tab and seeks the video to it once a second.
   */
  scoreClockRef: MutableRefObject<ScoreClock | null>;
  effectiveBpm: number;
  sourceBpm: number;
  /** Where the tab's bars sit in the video — see the same prop on the file player. */
  tempoMap: RecordingTempoMap;
  offsetMs: number;
  volume: number;
  muted: boolean;
  /** Bumped when the user moves the offset. Vital here: a free-running video is
   *  never corrected by drift, so without this a nudge would do nothing at all. */
  realignKey: number;
}

interface YouTubeBackingPlayerState {
  /** Pass to react-youtube's onReady. */
  handleReady: (event: { target: YouTubePlayer }) => void;
  driftMsRef: MutableRefObject<number>;
  /** Rate the player will actually settle on for the current tempo. */
  appliedRate: number;
  /** False when the video cannot hold the session tempo — then it free-runs
   *  and the UI offers a tempo it can hold. */
  canFollowTempo: boolean;
  /** Rates this particular video offers, once it has told us. */
  availableRates: readonly number[];
  /** Where the video is now and what it is doing — null with no player up. */
  getPlayerClock: () => YouTubeClockReading | null;
}

/**
 * Drives an embedded YouTube video off the same beat clock as the tab.
 *
 * YouTube only plays at a fixed set of rates, so it locks to the tab at some
 * tempos and cannot at others. Where it can't, the loop deliberately stops
 * correcting: the error is a rate mismatch that regrows every second, so
 * seeking at it just tears the picture on repeat without ever catching up.
 */
export function useYouTubeBackingPlayer({
  videoId,
  isPlaying,
  startTime,
  scoreClockRef,
  effectiveBpm,
  sourceBpm,
  tempoMap,
  offsetMs,
  volume,
  muted,
  realignKey,
}: UseYouTubeBackingPlayerOptions): YouTubeBackingPlayerState {
  // The handle lives in a ref, not state: it has to be droppable from inside
  // the sync loop (see runOnPlayer) without scheduling a render, and nothing
  // renders from it. A counter bumped on every new player is what actually
  // re-runs the effects.
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [playerGeneration, setPlayerGeneration] = useState(0);
  const [availableRates, setAvailableRates] =
    useState<readonly number[]>(YOUTUBE_FALLBACK_RATES);
  const driftMsRef = useRef(0);

  const handleReady = useCallback((event: { target: YouTubePlayer }) => {
    playerRef.current = event.target;
    // The supported rates are per video, so the hardcoded list is only a guess
    // until the player itself answers.
    try {
      const rates = event.target.getAvailablePlaybackRates?.();
      if (Array.isArray(rates) && rates.length > 0) setAvailableRates(rates);
    } catch {
      /* keep the fallback list */
    }
    setPlayerGeneration((generation) => generation + 1);
  }, []);

  /**
   * Every call into the iframe API has to survive the handle outliving its
   * iframe: react-youtube destroys the player on unmount (and StrictMode
   * unmounts everything once in dev), but `onReady` has already handed us the
   * object. Calling a destroyed player throws from inside YouTube's own
   * postMessage, where it reads `src` off an iframe element that is now null.
   *
   * A throw means the handle is dead, so drop it — every later call becomes a
   * no-op until the remounted iframe hands us a fresh one through onReady.
   */
  const runOnPlayer = useCallback((action: (player: YouTubePlayer) => void) => {
    const player = playerRef.current;
    if (!player) return;
    try {
      action(player);
    } catch {
      playerRef.current = null;
    }
  }, []);

  // A new video means a fresh iframe, and the old handle dies with it. Cleared
  // here rather than on the next call so nothing can drive the outgoing player.
  useEffect(() => {
    playerRef.current = null;
  }, [videoId]);

  const exactRate = playbackRateFor(effectiveBpm, sourceBpm);
  const appliedRate = resolveYouTubeRate(exactRate, availableRates);
  const canFollowTempo = canYouTubeFollow(exactRate, availableRates);

  useEffect(() => {
    runOnPlayer((player) => {
      player.setVolume(Math.round(Math.min(1, Math.max(0, volume)) * 100));
      if (muted) player.mute();
      else player.unMute();
    });
  }, [runOnPlayer, playerGeneration, volume, muted]);

  // Read through a ref rather than the effect's deps: the offset slider changes
  // these on every pixel, and a dependency would restart the loop — and pause
  // the video — mid-drag, during the one task the slider exists for.
  const paramsRef = useRef({ effectiveBpm, sourceBpm, offsetMs, tempoMap, appliedRate, canFollowTempo });
  useEffect(() => {
    paramsRef.current = { effectiveBpm, sourceBpm, offsetMs, tempoMap, appliedRate, canFollowTempo };
  }, [effectiveBpm, sourceBpm, offsetMs, tempoMap, appliedRate, canFollowTempo]);

  // Lets the realign effect below reach into the running loop without listing
  // its inputs as dependencies (which would restart it mid-drag).
  const alignRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!videoId) return;

    if (!isPlaying || startTime === null) {
      runOnPlayer((player) => player.pauseVideo());
      driftMsRef.current = 0;
      return;
    }

    let started = false;
    // A user-driven realign is a jump, not drift — seek even when the tempo
    // mismatch has otherwise put the video into free-running mode.
    let forceSeek = false;

    const align = () => {
      const {
        effectiveBpm: bpm,
        tempoMap: map,
        appliedRate: rate,
        canFollowTempo: tempoHolds,
      } = paramsRef.current;
      const beats = beatsSinceStart(Date.now(), startTime, bpm, scoreClockRef.current);
      const target = map.secForBeat(beats);

      // The video starts after the tab does (negative offset) — stay paused.
      if (target < 0) {
        runOnPlayer((player) => player.pauseVideo());
        driftMsRef.current = 0;
        return;
      }

      runOnPlayer((player) => {
        player.setPlaybackRate(rate);
        const drift = player.getCurrentTime() - target;
        driftMsRef.current = drift * 1000;

        // Correct only when the video can hold this tempo. When it can't, the
        // gap is a *rate* error: it regrows within a second, so re-seeking
        // never wins it and only tears the picture every couple of seconds.
        // Align once at the start, then let it run — the panel offers a tempo
        // that actually locks instead.
        if (!started || forceSeek || (tempoHolds && Math.abs(drift) > SEEK_THRESHOLD_SEC)) {
          player.seekTo(target, true);
        }
        forceSeek = false;
        player.playVideo();
        started = true;
      });
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
      runOnPlayer((player) => player.pauseVideo());
    };
  }, [videoId, playerGeneration, isPlaying, startTime, scoreClockRef, runOnPlayer]);

  // Declared after the loop so alignRef points at the live closure, and after
  // the params effect so it reads the offset the user just set.
  useEffect(() => {
    alignRef.current?.();
  }, [realignKey]);

  /**
   * The longest length this video has ever admitted to.
   *
   * An ad has its own timeline: while one runs the player reports the ad's
   * position and the ad's length, and anything recorded against those numbers
   * lands in the wrong song. A length well short of one already seen is the
   * signal that the timeline currently on offer is not this video's.
   */
  const longestDurationRef = useRef(0);
  useEffect(() => {
    longestDurationRef.current = 0;
  }, [videoId]);

  /**
   * Where the video is now and what it is doing, or null when no player is up.
   *
   * Exposed for waveform learning: a video's audio can only be read by listening
   * to it, and the samples have to be filed under the video's own clock — wall
   * time would smear the picture the moment anything paused or was seeked. What
   * it is *doing* matters as much as where it is: audio heard while the reported
   * position stands still belongs nowhere, and audio heard during an ad belongs
   * to another recording.
   */
  const getPlayerClock = useCallback((): YouTubeClockReading | null => {
    const player = playerRef.current;
    if (!player) return null;
    try {
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration?.() ?? 0;
      if (!Number.isFinite(currentTime) || !Number.isFinite(duration)) return null;

      if (duration > longestDurationRef.current) longestDurationRef.current = duration;
      const onOwnTimeline = duration >= longestDurationRef.current * AD_DURATION_RATIO;

      // Absent on the minimal players the tests stand in with, where treating
      // the video as playing is far better than recording nothing at all.
      const state = player.getPlayerState?.() ?? YOUTUBE_STATE_PLAYING;

      return {
        currentTime,
        duration,
        rate: paramsRef.current.appliedRate,
        isPlaying: state === YOUTUBE_STATE_PLAYING && onOwnTimeline,
      };
    } catch {
      return null;
    }
  }, []);

  return { handleReady, driftMsRef, appliedRate, canFollowTempo, availableRates, getPlayerClock };
}
