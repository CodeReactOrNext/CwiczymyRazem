/** Strings the board draws, numbered high e (1) → low E (6). */
export const STRING_COUNT = 6;

/**
 * Which staff line a string is drawn on — 0 is the top line.
 *
 * Standard tablature puts the high e on top, and that order is the same for
 * both hands: handedness decides which way the neck points, and the tab has no
 * neck axis to mirror (its horizontal axis is time). `flipStrings` is for the
 * one case that does invert it — a player using a right-handed guitar strung
 * the other way round, so the low E is the string nearest their picking hand.
 *
 * Shared by the render data, which bakes each note's y, and the worker, which
 * places the tuning gutter and the editor selection from string numbers: the
 * two must never disagree about which line a string sits on.
 */
export function stringRow(string: number, flipStrings = false): number {
  return flipStrings ? STRING_COUNT - string : string - 1;
}
