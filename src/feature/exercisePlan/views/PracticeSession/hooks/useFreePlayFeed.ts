import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { useEffect, useMemo, useRef } from "react";
import { getUniformTuningShift } from "utils/audio/tunings";

import type { TablatureMeasure } from "../../../types/exercise.types";
import type { FreePlayFrame } from "../utils/freePlay";
import { freshAttacks } from "../utils/freePlay";
import { buildTempoMap, createBeatClock } from "./tempoBeatClock";

interface UseFreePlayFeedOptions {
  /** Takes every frame; nothing runs without it. */
  onFreePlay?: (frame: FreePlayFrame) => void;
  isPlaying: boolean;
  startTime: number | null;
  audioContext?: AudioContext | null;
  audioStartTime?: number | null;
  effectiveBpm: number;
  activeTablature: TablatureMeasure[] | null | undefined;
  isMicEnabled: boolean;
  getLatencyMs: () => number;
  calibratedLatencyMs?: number | null;
  audioRefs: AudioRefs;
  tuningOffsets?: readonly number[];
}

/**
 * Hands a listener the run's clock and every attack the player makes, frame
 * by frame, on the same clock the matcher judges the tab on (the audio clock,
 * latency taken off) — for a mode that judges playing against something
 * other than the tab's notes, like a solo over the chords.
 */
export function useFreePlayFeed({
  onFreePlay,
  isPlaying,
  startTime,
  audioContext,
  audioStartTime,
  effectiveBpm,
  activeTablature,
  isMicEnabled,
  getLatencyMs,
  calibratedLatencyMs,
  audioRefs,
  tuningOffsets,
}: UseFreePlayFeedOptions) {
  const onFreePlayRef = useRef(onFreePlay);
  useEffect(() => {
    onFreePlayRef.current = onFreePlay;
  }, [onFreePlay]);
  const active = !!onFreePlay;

  // Outside the loop's effect: it restarts on every identity change of its
  // inputs (audioRefs is a fresh object each render), and an attack handed
  // on once must never be handed on again.
  const seenRef = useRef<Set<number>>(new Set());

  const beatClock = useMemo(() => {
    if (!activeTablature?.length) return null;
    const totalBeats = activeTablature.reduce(
      (sum, measure) => sum + measure.beats.reduce((s, beat) => s + beat.duration, 0),
      0,
    );
    return createBeatClock(buildTempoMap(activeTablature), totalBeats, effectiveBpm);
  }, [activeTablature, effectiveBpm]);

  const tuningShift = getUniformTuningShift(tuningOffsets);

  useEffect(() => {
    if (!active || !isPlaying || !startTime || !isMicEnabled || !beatClock) return undefined;
    let rafId = 0;
    const msPerBeat = 60000 / effectiveBpm;
    const tick = () => {
      const now = Date.now();
      const latencySec = (calibratedLatencyMs ?? getLatencyMs()) / 1000;
      const elapsedSec =
        audioContext && audioStartTime != null
          ? audioContext.currentTime - audioStartTime
          : (now - startTime) / 1000;
      const beat = beatClock.toBeats(elapsedSec - latencySec);
      const attacks = freshAttacks(audioRefs.noteEventsRef.current, seenRef.current, now, beat, msPerBeat);
      onFreePlayRef.current?.({ beat, msPerBeat, attacks, tuningShift });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    active,
    isPlaying,
    startTime,
    isMicEnabled,
    beatClock,
    effectiveBpm,
    calibratedLatencyMs,
    getLatencyMs,
    audioContext,
    audioStartTime,
    audioRefs,
    tuningShift,
  ]);
}
