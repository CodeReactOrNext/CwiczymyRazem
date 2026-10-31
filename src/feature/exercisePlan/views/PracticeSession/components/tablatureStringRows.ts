/** Strings the board draws by default, numbered high e (1) → low E (6). */
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
export function stringRow(string: number, flipStrings = false, stringCount = STRING_COUNT): number {
  return flipStrings ? stringCount - string : string - 1;
}

/**
 * The gap between lines for a staff of `stringCount` strings: a four-string bass
 * tab spreads its lines over the same height six guitar strings take, so
 * everything laid out around the staff (chord names, the rhythm lane, the
 * palm-mute row) stays where it is.
 */
export function staffLineSpacing(guitarSpacing: number, stringCount = STRING_COUNT): number {
  return stringCount > 1 ? (guitarSpacing * (STRING_COUNT - 1)) / (stringCount - 1) : guitarSpacing;
}

/**
 * The left gutter's legend: each string's tuned note, string 1 first. The
 * notation runs low → high ("E A D G B E"), so the last name is string 1; a
 * string the notation doesn't name (a seven-string under a six-string tuning)
 * gets an empty pill rather than someone else's note.
 */
export function tuningGutterStrings(
  notation: string,
  stringCount: number,
  palette: readonly string[],
): { string: number; label: string; color: string }[] {
  const names = notation.split(/\s+/);
  return Array.from({ length: stringCount }, (_, i) => i + 1).map((string) => ({
    string,
    label: names[names.length - string] ?? "",
    color: palette[string - 1] ?? "#ffffff",
  }));
}
