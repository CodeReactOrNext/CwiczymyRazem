import { useCallback, useEffect, useRef, useState } from "react";

import { isUsableTap, offsetFromTaps, tapErrorMs } from "../utils/alignment";

/** Taps kept in the running window. Enough to median away a bad one. */
const TAP_MEMORY = 8;
/** A gap this long means the player stopped and started again — begin afresh. */
const TAP_RESET_MS = 3_000;

interface UseTapAlignOptions {
  enabled: boolean;
  startTime: number | null;
  effectiveBpm: number;
  sourceBpm: number;
  offsetMs: number;
  onOffsetChange: (next: number) => void;
}

interface TapAlignState {
  /** Call on every tap — button click or key press. */
  tap: () => void;
  /** How many usable taps are in the current run. */
  tapCount: number;
  /** Median error of the current run, in ms. Null before the first usable tap. */
  errorMs: number | null;
  /** The last tap fell between two beats, so nothing was applied. */
  wasAmbiguous: boolean;
  reset: () => void;
}

/**
 * Aligns a recording by ear: the player taps along with what they hear, and each
 * tap is measured against the nearest tab beat.
 *
 * This is the only alignment a YouTube video can have — its audio is inside a
 * cross-origin iframe, so there is no waveform to look at. It works just as well
 * for a local file when the player would rather listen than look.
 *
 * Corrections apply from the first tap and keep sharpening as more arrive, so
 * the fix is audible immediately instead of after some ceremony.
 */
export function useTapAlign({
  enabled,
  startTime,
  effectiveBpm,
  sourceBpm,
  offsetMs,
  onOffsetChange,
}: UseTapAlignOptions): TapAlignState {
  const [tapCount, setTapCount] = useState(0);
  const [errorMs, setErrorMs] = useState<number | null>(null);
  const [wasAmbiguous, setWasAmbiguous] = useState(false);

  const errorsRef = useRef<number[]>([]);
  const lastTapRef = useRef(0);

  // Read through a ref so the tap handler never goes stale, and so binding the
  // key doesn't depend on values that change on every correction.
  const paramsRef = useRef({ startTime, effectiveBpm, sourceBpm, offsetMs, onOffsetChange });
  useEffect(() => {
    paramsRef.current = { startTime, effectiveBpm, sourceBpm, offsetMs, onOffsetChange };
  }, [startTime, effectiveBpm, sourceBpm, offsetMs, onOffsetChange]);

  const reset = useCallback(() => {
    errorsRef.current = [];
    setTapCount(0);
    setErrorMs(null);
    setWasAmbiguous(false);
  }, []);

  const tap = useCallback(() => {
    const now = Date.now();
    const p = paramsRef.current;

    // A long silence means this is a new attempt, not a continuation.
    if (now - lastTapRef.current > TAP_RESET_MS) errorsRef.current = [];
    lastTapRef.current = now;

    const error = tapErrorMs(now, p.startTime, p.effectiveBpm);
    if (error === null) return;

    // Each correction moves the track, so later taps are measured against a
    // grid that has already been partly fixed. Keeping raw errors would then
    // double-count; the run restarts from the corrected position instead.
    if (!isUsableTap(error, p.effectiveBpm)) {
      errorsRef.current = [];
      setTapCount(0);
      setErrorMs(null);
      setWasAmbiguous(true);
      return;
    }
    setWasAmbiguous(false);

    const errors = [...errorsRef.current, error].slice(-TAP_MEMORY);
    errorsRef.current = errors;
    setTapCount(errors.length);
    setErrorMs(error);

    p.onOffsetChange(
      offsetFromTaps({
        errorsMs: [error],
        currentOffsetMs: p.offsetMs,
        effectiveBpm: p.effectiveBpm,
        sourceBpm: p.sourceBpm,
      }),
    );
  }, []);

  // T for tap — free, and next to the left hand that isn't holding a pick.
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key !== "t" && event.key !== "T") return;
      event.preventDefault();
      tap();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, tap]);

  return { tap, tapCount, errorMs, wasAmbiguous, reset };
}
