import type { TablatureMeasure } from "../../../types/exercise.types";

/** Ratios closer than this are the same tempo as far as a listener is concerned. */
const RATIO_EPSILON = 1e-4;

/**
 * Stamps a backing track's tempo curve onto the measures the session plays.
 *
 * The Align screen records where each bar of the recording actually happens
 * (see feature/backingTrack/utils/tempoMap). That curve has to reach the
 * cursor, the click, the note matcher and the tab's own playback — four clocks
 * that would otherwise each need teaching about backing tracks.
 *
 * They already share one channel: `TablatureMeasure.tempoChange`, which Guitar
 * Pro imports use for exactly this. Projecting the curve onto it means the whole
 * session follows the band with no further wiring.
 *
 * A ratio, not a BPM, so the speed slider keeps scaling the piece as a whole.
 *
 * `ratioAtBeat` null (no recording aligned, or an even one) returns the measures
 * untouched — including their identity, so nothing downstream re-renders.
 */
export function withBackingTempo(
  measures: TablatureMeasure[] | undefined,
  ratioAtBeat: ((beat: number) => number) | null,
): TablatureMeasure[] | undefined {
  if (!measures?.length || !ratioAtBeat) return measures;

  const next: TablatureMeasure[] = [];
  let beat = 0;
  // Only emit where the tempo actually changes: that is what tempoChange means,
  // and a marker on every bar would bloat the map the cursor walks each frame.
  let previousRatio = 1;
  let changed = false;

  for (const measure of measures) {
    const ratio = ratioAtBeat(beat);
    const isNew = Math.abs(ratio - previousRatio) > RATIO_EPSILON;

    if (isNew) {
      next.push({ ...measure, tempoChange: ratio });
      previousRatio = ratio;
      changed = true;
    } else if (measure.tempoChange !== undefined) {
      // The recording is the truth for playing along, so a tempo the file came
      // with (a GP import's own automation) is dropped rather than fighting it.
      const copy = { ...measure };
      delete copy.tempoChange;
      next.push(copy);
      changed = true;
    } else {
      next.push(measure);
    }

    beat += measure.beats.reduce((sum, b) => sum + b.duration, 0);
  }

  return changed ? next : measures;
}
