import { useCallback, useEffect, useRef, useState } from "react";

import type { Exercise } from "../../../types/exercise.types";

export interface HuntTarget {
  goal: string;
  prompt?: { title: string; subtitle?: string };
  region?: { startFret: number; endFret: number };
}

export interface NoteHuntRotation {
  /** Current target (note/chord + optional prompt/region), or null when not a rotating hunt. */
  target: HuntTarget | null;
  /** Seconds until the target rotates, or null when not a rotating hunt. */
  secondsLeft: number | null;
  /** Manually advance to the next target now (for players not using pitch detection). */
  advance: () => void;
}

// Once the player has fully solved the current goal, fast-forward the countdown
// to at most this many seconds so it advances to the next target quickly.
const SOLVED_FASTFORWARD_SECONDS = 3;

/**
 * Drives a rotating hunt (Random/Chromatic/Region Note Hunt, Interval Hunt, Build
 * the Chord): every `noteHuntConfig.rotateSeconds` it rolls a fresh target via the
 * exercise's `rollHuntTarget()` and restarts the countdown. The target lives in
 * React state here — NOT read from a getter on the exercise — so it survives the
 * object spreads that exercises go through (e.g. exercisesAgregat) and always
 * re-renders consumers when it changes.
 *
 * Only ticks while the session is playing (pausing freezes the timer). When
 * `solvedRef.current` is true the remaining countdown is clamped to ~3s.
 */
export function useNoteHuntRotation(
  exercise: Exercise,
  isPlaying: boolean,
  solvedRef?: React.MutableRefObject<boolean>,
): NoteHuntRotation {
  const rotateSeconds = exercise.noteHuntConfig?.rotateSeconds ?? 0;
  const enabled = rotateSeconds > 0 && typeof exercise.rollHuntTarget === "function";

  // Fresh ref to the roll fn so the interval/advance never hold a stale closure.
  const rollRef = useRef(exercise.rollHuntTarget);
  useEffect(() => { rollRef.current = exercise.rollHuntTarget; });

  const [target, setTarget] = useState<HuntTarget | null>(() =>
    enabled && exercise.rollHuntTarget ? exercise.rollHuntTarget() : null,
  );
  const [secondsLeft, setSecondsLeft] = useState<number | null>(enabled ? rotateSeconds : null);
  const secondsRef = useRef(rotateSeconds);

  // Re-roll + restart the countdown when a NEW exercise is entered (skip the very
  // first run — the initial target already came from the useState initializer).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    secondsRef.current = rotateSeconds;
    setTarget(enabled ? rollRef.current!() : null);
    setSecondsLeft(enabled ? rotateSeconds : null);
  }, [exercise.id, enabled, rotateSeconds]);

  // Jump to a fresh target immediately and restart the countdown.
  const advance = useCallback(() => {
    if (!enabled) return;
    setTarget(rollRef.current!());
    secondsRef.current = rotateSeconds;
    setSecondsLeft(rotateSeconds);
  }, [enabled, rotateSeconds]);

  useEffect(() => {
    if (!enabled || !isPlaying) return;
    const id = setInterval(() => {
      // Goal complete → hurry to the next target.
      if (solvedRef?.current && secondsRef.current > SOLVED_FASTFORWARD_SECONDS) {
        secondsRef.current = SOLVED_FASTFORWARD_SECONDS;
      }
      if (secondsRef.current <= 1) {
        setTarget(rollRef.current!()); // new target object → always re-renders
        secondsRef.current = rotateSeconds;
      } else {
        secondsRef.current -= 1;
      }
      setSecondsLeft(secondsRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [enabled, isPlaying, rotateSeconds, solvedRef]);

  return {
    target: enabled ? target : null,
    secondsLeft: enabled ? secondsLeft : null,
    advance,
  };
}
