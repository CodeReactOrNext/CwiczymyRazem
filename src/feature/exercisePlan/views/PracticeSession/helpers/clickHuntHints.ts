/**
 * When a click hunt's hints come up, counted from the round's start or its last
 * find. An exam round lasts EXAM_CLICK_ROTATE_SECONDS and an unanswered one ends
 * the exam, so both have to land well inside it; practice rounds run far longer.
 */
export const EXAM_HINT_MS = [3000, 6000] as const;
export const PRACTICE_HINT_MS = [6000, 12000] as const;

/**
 * Unfound positions on one E string while the same fret on the other is already
 * found. Both carry the same notes, and players new to the neck find the thick
 * one, then take the thin e for a different string (reported as "low E is
 * bugged": the note was there twice and they couldn't see the second).
 */
export function unfoundTwinEStrings(positions: { string: number; fret: number }[], foundKeys: string[]): number[] {
  const found = new Set(foundKeys);
  const strings: number[] = [];
  for (const { string, fret } of positions) {
    if (found.has(`${string}-${fret}`)) continue;
    const twin = string === 1 ? 6 : string === 6 ? 1 : null;
    if (twin && found.has(`${twin}-${fret}`)) strings.push(string);
  }
  return strings;
}
