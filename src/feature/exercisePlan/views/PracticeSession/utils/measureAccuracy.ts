import type { TablatureMeasure } from "../../../types/exercise.types";

/**
 * Pitch-detect accuracy per measure: the share of that measure's notes played
 * correctly so far this pass, null for a measure with nothing judged yet. Keys
 * are the matcher's (`${measureIdx}-${beatIdx}-${noteIdx}`); a note in both
 * maps counts as hit.
 *
 * Reads only the notes judged so far rather than walking the whole tab: it runs
 * on every hit, many times a second, and a song can be hundreds of bars long.
 */
export function accuracyPerMeasure(
  measures: readonly TablatureMeasure[],
  hitNotes: Record<string, unknown>,
  missedNotes: Record<string, unknown>,
): (number | null)[] {
  const hit = new Array<number>(measures.length).fill(0);
  const judged = new Array<number>(measures.length).fill(0);
  /** The key's measure, or -1 when it names no note of this tab. */
  const measureOf = (key: string): number => {
    const [m, b, n] = key.split("-").map(Number);
    return measures[m]?.beats[b]?.notes[n] ? m : -1;
  };
  for (const key of Object.keys(hitNotes)) {
    if (!hitNotes[key]) continue;
    const m = measureOf(key);
    if (m < 0) continue;
    hit[m]++;
    judged[m]++;
  }
  for (const key of Object.keys(missedNotes)) {
    if (!missedNotes[key] || hitNotes[key]) continue;
    const m = measureOf(key);
    if (m >= 0) judged[m]++;
  }
  return judged.map((count, m) => (count > 0 ? hit[m] / count : null));
}
