import type {
  TablatureBeat,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";

/** Triplet grids give durations of 1/3, which never sum to an exact integer. */
const DURATION_EPSILON = 1e-6;

/**
 * Length of one measure in quarter notes (the unit `TablatureBeat.duration` uses).
 * Formula: numerator × (4 / denominator) → 4/4 = 4, 3/4 = 3, 6/8 = 3, 7/8 = 3.5
 */
export function measureDurationInQuarters(
  timeSignature: [number, number],
): number {
  const [numerator, denominator] = timeSignature;
  return numerator * (4 / denominator);
}

/** Length actually written into a measure, in quarter notes. */
export function beatsDurationInQuarters(beats: TablatureBeat[]): number {
  return beats.reduce((total, beat) => total + beat.duration, 0);
}

/**
 * How far a measure's beats are from filling its time signature, in quarter
 * notes. Negative = too short, positive = overflowing into the next bar.
 */
export function measureDurationError(measure: TablatureMeasure): number {
  return (
    beatsDurationInQuarters(measure.beats) -
    measureDurationInQuarters(measure.timeSignature)
  );
}

/** True when a measure's beats exactly fill its time signature. */
export function isMeasureComplete(measure: TablatureMeasure): boolean {
  return Math.abs(measureDurationError(measure)) < DURATION_EPSILON;
}

/**
 * Number of grid steps needed to tile a measure with notes of `stepDuration`.
 * Rounds for signatures that don't divide evenly (7/8 can't be tiled with
 * quarter notes); the caller re-derives the real duration from the step count,
 * so the measure still sums correctly.
 */
export function stepsForDuration(
  timeSignature: [number, number],
  stepDuration: number,
): number {
  return Math.max(
    1,
    Math.round(measureDurationInQuarters(timeSignature) / stepDuration),
  );
}
