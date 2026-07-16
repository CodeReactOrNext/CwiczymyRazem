import type {
  TablatureBeat,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";
import { measureDurationInQuarters } from "feature/exercisePlan/utils/measureDuration";

export const DEFAULT_TIME_SIGNATURE: [number, number] = [4, 4];
export const DEFAULT_STEPS = 16;

/**
 * Beats sized so they exactly fill `timeSignature`. Deriving every duration from
 * the signature is what keeps a measure musically valid: the editor grid can't
 * express "16 quarter notes in a 4/4 bar" by construction.
 *
 * `seed` supplies the beat previously occupying each step, if any — its notes
 * are carried over, its duration is not.
 */
export function buildBeats(
  timeSignature: [number, number],
  steps: number,
  seed: (index: number) => TablatureBeat | undefined = () => undefined,
): TablatureBeat[] {
  const duration = measureDurationInQuarters(timeSignature) / steps;
  return Array.from({ length: steps }, (_, i) => {
    const previous = seed(i);
    return { ...previous, notes: previous?.notes ?? [], duration };
  });
}

export function createMeasure(
  timeSignature: [number, number] = DEFAULT_TIME_SIGNATURE,
  steps: number = DEFAULT_STEPS,
): TablatureMeasure {
  return { timeSignature, beats: buildBeats(timeSignature, steps) };
}

/**
 * Re-lay a measure onto `steps` evenly-sized beats of `timeSignature`, keeping
 * the notes that still land inside the grid. Notes beyond `steps` are dropped —
 * the caller is expected to make this undoable.
 */
export function regridMeasure(
  measure: TablatureMeasure,
  timeSignature: [number, number],
  steps: number,
): TablatureMeasure {
  return {
    ...measure,
    timeSignature,
    beats: buildBeats(timeSignature, steps, (i) => measure.beats[i]),
  };
}
