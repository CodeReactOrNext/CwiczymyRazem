import type { TablatureMeasure } from "../types/exercise.types";

/**
 * True when the measures carry at least one played note.
 *
 * `tablature.length > 0` is not the same question: the Tab Editor hands out a
 * full grid of measures whether or not the user typed anything, so a user-made
 * exercise can carry measures full of empty beats. Those used to render as a
 * blank tab instead of reading as the instruction-only exercise they are, so
 * use this wherever the question is "does this exercise have a tab at all?".
 */
export const hasTablatureNotes = (
  measures?: TablatureMeasure[] | null,
): boolean =>
  !!measures?.some((measure) =>
    measure?.beats?.some((beat) => (beat?.notes?.length ?? 0) > 0),
  );
