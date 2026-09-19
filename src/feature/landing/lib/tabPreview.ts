import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

export interface TabPreviewNote {
  /** 1 = high E … 6 = low E, the same convention as `TablatureNote`. */
  string: number;
  fret: number;
  /** Reached by hammer-on / pull-off. Drawn hollow, so a legato drill reads
   *  differently from a picked one even when the fret path is identical. */
  slur?: true;
}

export const TAB_PREVIEW_LENGTH = 16;

/**
 * The first `length` sounded notes of an exercise, flattened across measures,
 * one note per beat (rests are skipped, chords contribute their first note).
 *
 * Feeds `TabPreviewGlyph` on the landing exercise cards: the shape of the
 * opening bar is what tells a "one string" spider apart from a "shifting up
 * the neck" one, which a generic guitar icon never could. Kept JSON-safe (no
 * `undefined` fields) because it travels through `getStaticProps`.
 */
export function getTabPreview(
  tablature: TablatureMeasure[] | undefined,
  length = TAB_PREVIEW_LENGTH,
): TabPreviewNote[] {
  if (!tablature) return [];
  const notes: TabPreviewNote[] = [];
  for (const measure of tablature) {
    for (const beat of measure.beats) {
      if (notes.length >= length) return notes;
      const note = beat.notes[0];
      if (!note) continue;
      const slurred = note.isHammerOn || note.isPullOff;
      notes.push(
        slurred
          ? { string: note.string, fret: note.fret, slur: true }
          : { string: note.string, fret: note.fret },
      );
    }
  }
  return notes;
}
