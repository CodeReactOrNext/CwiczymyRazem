import { rootNotes } from "feature/exercisePlan/scales/scaleDefinitions";

/**
 * The tree is authored in C: every fret stored on a node (`RequiredExercise.position`,
 * `SCALE_TREE_POSITIONS`) is where that shape sits when the root is C. Any other key
 * is the very same shape moved along the neck, so the tree itself never changes —
 * only the fret it is played on, and the notes the generator writes into the tab.
 */
export const BASE_ROOT_NOTE = "C";

/** Keys the tree can be played in, chromatic order starting from C. */
export const SCALE_TREE_KEYS = rootNotes;

export function isScaleTreeKey(value: unknown): value is string {
  return typeof value === "string" && SCALE_TREE_KEYS.includes(value);
}

/** Semitones between C and `rootNote` — how far up the neck the whole tree moves. */
export function keyOffset(rootNote: string): number {
  const index = SCALE_TREE_KEYS.indexOf(rootNote);
  return index === -1 ? 0 : index;
}

/**
 * The fret a C shape sits on once the tree is played in `rootNote`. Kept inside
 * the first octave (1–12) so shapes stay reachable: fret 13 comes back as fret 1,
 * which is the same shape an octave lower.
 */
export function transposeFret(cFret: number, rootNote: string): number {
  // Single-string nodes carry no fret (position 0) — nothing to move.
  if (cFret <= 0) return cFret;
  return ((cFret - 1 + keyOffset(rootNote)) % 12) + 1;
}
