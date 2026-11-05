import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

export interface FingeredNote {
  /** 1 = high e … 6 = low E. */
  string: number;
  fret: number;
  /** 1 = index … 4 = pinky. */
  finger: number;
}

export interface FingeringStep {
  /** Beat position (quarter notes from the start) where this step is struck. */
  start: number;
  notes: FingeredNote[];
  /** Fret under the index finger: one finger per fret from here. */
  position: number;
}

/**
 * The beats of `measures` that carry fingering, in playing order. Beats with no
 * fingered note (rests, open strings) are left out, so the hand keeps showing
 * the last grip until the next one.
 */
export function fingeringSteps(
  measures: TablatureMeasure[] | undefined,
): FingeringStep[] {
  const steps: FingeringStep[] = [];
  let pos = 0;
  for (const measure of measures ?? []) {
    for (const beat of measure.beats) {
      const notes: FingeredNote[] = beat.notes.flatMap((n) =>
        n.finger ? [{ string: n.string, fret: n.fret, finger: n.finger }] : [],
      );
      if (notes.length > 0) {
        steps.push({
          start: pos,
          notes,
          position: notes[0].fret - (notes[0].finger - 1),
        });
      }
      pos += beat.duration;
    }
  }
  return steps;
}

/** Index of the step sounding at `beat` — the first one before playback reaches it. */
export function stepIndexAt(steps: FingeringStep[], beat: number): number {
  if (steps.length === 0) return -1;
  // A hair of slack so a cursor resting exactly on a beat shows that beat.
  const at = beat + 1e-6;
  let lo = 0;
  let hi = steps.length - 1;
  let found = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (steps[mid].start <= at) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}
