import { useCallback, useEffect, useRef, useState } from "react";

import type { Exercise, HuntPrompt } from "../../../types/exercise.types";
import { isClickAnsweredMode } from "../../../utils/huntModes";

export interface HuntTarget {
  goal: string;
  prompt?: HuntPrompt;
  region?: { startFret: number; endFret: number };
}

/**
 * Where the metronome is, for hunts that change on the bar line. Both values come
 * straight off the running click, so the drill and the click can't drift: the bar
 * number is recomputed from the anchor every poll rather than counted up.
 */
export interface HuntBarClock {
  /** Wall-clock ms of the click's first beat — null whenever it isn't running. */
  startTime: number | null;
  /** One bar in ms at the tempo (and speed multiplier) actually being played. */
  msPerBar: number;
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

// Click-mode hunts (no mic, no physical constraint) get a much shorter rotation
// in exam mode than in free practice — the wide-open practice window (25s) let
// players brute-force every cell on the board with zero risk. 10s still allows a
// careful scan but no longer tolerates aimlessly clicking the whole diagram.
const EXAM_CLICK_ROTATE_SECONDS = 10;

// "advanceOn: solved" pacing. The hold lets the reveal land before the next
// target replaces it; the settle window keeps the guard closed a beat longer,
// because `solvedRef` only goes false once the provider has re-rendered on the
// new target — polling inside that gap would read the old `true` and skip the
// fresh target instantly.
const SOLVED_POLL_MS = 250;
const SOLVED_HOLD_MS = 1500;
const SOLVED_SETTLE_MS = 600;

// How often the bar-locked pacing checks the clock. Fine enough that a change
// lands within a fraction of a beat of the bar line at any playable tempo.
const BAR_POLL_MS = 60;

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
 *
 * `noteHuntConfig.advanceOn: "solved"` swaps the countdown for the opposite
 * pacing: the target holds until it is answered and only then moves on, with no
 * timer shown at all. Drills that are races keep the clock; drills a beginner is
 * meant to reason their way through shouldn't cut them off mid-thought.
 */
export function useNoteHuntRotation(
  exercise: Exercise,
  isPlaying: boolean,
  solvedRef?: React.MutableRefObject<boolean>,
  isExamMode = false,
  barClock?: HuntBarClock,
): NoteHuntRotation {
  const configuredRotateSeconds = exercise.noteHuntConfig?.rotateSeconds ?? 0;
  const isExamClickHunt = isExamMode && isClickAnsweredMode(exercise.noteHuntConfig?.mode);
  const rotateSeconds = isExamClickHunt && configuredRotateSeconds > 0 ? EXAM_CLICK_ROTATE_SECONDS : configuredRotateSeconds;
  // Drills that wait for an answer carry no countdown at all, so they are enabled
  // by the flag rather than by a rotation length they don't have.
  const waitsForAnswer = exercise.noteHuntConfig?.advanceOn === "solved";
  const enabled = (rotateSeconds > 0 || waitsForAnswer) && typeof exercise.rollHuntTarget === "function";

  // Bar pacing only engages while the click is actually running. With it stopped
  // the drill falls back to `rotateSeconds`, so turning the metronome off slows
  // the changes down rather than freezing them.
  const everyBars = Math.max(1, exercise.noteHuntConfig?.advanceEveryBars ?? 1);
  const msPerChange = (barClock?.msPerBar ?? 0) * everyBars;
  const barStartTime = barClock?.startTime ?? null;
  const barLocked =
    enabled && exercise.noteHuntConfig?.advanceOn === "bar" && barStartTime !== null && msPerChange > 0;

  const countsDown = enabled && !waitsForAnswer && !barLocked;

  // Fresh ref to the roll fn so the interval/advance never hold a stale closure.
  const rollRef = useRef(exercise.rollHuntTarget);
  useEffect(() => { rollRef.current = exercise.rollHuntTarget; });

  const [target, setTarget] = useState<HuntTarget | null>(() =>
    enabled && exercise.rollHuntTarget ? exercise.rollHuntTarget() : null,
  );
  const [secondsLeft, setSecondsLeft] = useState<number | null>(countsDown ? rotateSeconds : null);
  const secondsRef = useRef(rotateSeconds);

  // Re-roll + restart the countdown when a NEW exercise is entered (skip the very
  // first run — the initial target already came from the useState initializer).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    secondsRef.current = rotateSeconds;
    setTarget(enabled ? rollRef.current!() : null);
    setSecondsLeft(countsDown ? rotateSeconds : null);
  }, [exercise.id, enabled, countsDown, rotateSeconds]);

  // Jump to a fresh target immediately and restart the countdown.
  const advance = useCallback(() => {
    if (!enabled) return;
    setTarget(rollRef.current!());
    secondsRef.current = rotateSeconds;
    setSecondsLeft(countsDown ? rotateSeconds : null);
  }, [enabled, countsDown, rotateSeconds]);

  useEffect(() => {
    if (!countsDown || !isPlaying) return;
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
  }, [countsDown, isPlaying, rotateSeconds, solvedRef]);

  // Bar-locked pacing: the change lands on the bar line, and the countdown shows
  // the time left in the current group of bars.
  //
  // The group index is recomputed from the click's own anchor on every poll
  // rather than counted up on each change, so a slow tick, a paused tab or a
  // tempo change can never leave the drill a bar behind the click it is supposed
  // to be following.
  const barGroupRef = useRef<number | null>(null);
  useEffect(() => {
    if (!barLocked || !isPlaying || barStartTime === null) { barGroupRef.current = null; return; }
    const readClock = () => {
      const elapsed = Date.now() - barStartTime;
      if (elapsed < 0) return; // click scheduled but not sounding yet
      const group = Math.floor(elapsed / msPerChange);
      // First read after the click starts adopts the bar it starts on, so the
      // target doesn't jump the moment the drill picks the clock up.
      if (barGroupRef.current !== null && group !== barGroupRef.current) {
        setTarget(rollRef.current!());
      }
      barGroupRef.current = group;
      setSecondsLeft(Math.ceil((msPerChange - (elapsed % msPerChange)) / 1000));
    };
    readClock();
    const id = setInterval(readClock, BAR_POLL_MS);
    return () => clearInterval(id);
  }, [barLocked, isPlaying, barStartTime, msPerChange]);

  // Wait-for-answer pacing: nothing moves until the goal is solved, then the next
  // target comes up after a beat. Polled rather than subscribed because
  // `solvedRef` is a ref and never re-renders — the same reason the countdown
  // above reads it on a tick.
  const advanceRef = useRef(advance);
  useEffect(() => { advanceRef.current = advance; });
  useEffect(() => {
    if (!enabled || !waitsForAnswer || !isPlaying) return;
    let hold: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      if (hold || !solvedRef?.current) return;
      hold = setTimeout(() => {
        advanceRef.current();
        setTimeout(() => { hold = undefined; }, SOLVED_SETTLE_MS);
      }, SOLVED_HOLD_MS);
    }, SOLVED_POLL_MS);
    return () => { clearInterval(id); if (hold) clearTimeout(hold); };
  }, [enabled, waitsForAnswer, isPlaying, solvedRef]);

  return {
    target: enabled ? target : null,
    secondsLeft: enabled ? secondsLeft : null,
    advance,
  };
}
