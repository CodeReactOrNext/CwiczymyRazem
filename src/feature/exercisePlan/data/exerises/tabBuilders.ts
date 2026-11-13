import type {
  TablatureBeat,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

/**
 * Small constructors for hand-written tablature, so an exercise file reads as
 * the riff it holds instead of as object literals. Durations are in quarter
 * notes, strings count from 1 (the highest).
 */

type NoteExtras = Omit<TablatureNote, "string" | "fret">;
type BeatExtras = Omit<TablatureBeat, "duration" | "notes">;

export const note = (
  string: number,
  fret: number,
  extras: NoteExtras = {},
): TablatureNote => ({ string, fret, ...extras });

export const beat = (
  duration: number,
  notes: TablatureNote | TablatureNote[],
  extras: BeatExtras = {},
): TablatureBeat => ({
  duration,
  notes: Array.isArray(notes) ? notes : [notes],
  ...extras,
});

/** Silence for `duration` quarter notes. */
export const rest = (duration: number): TablatureBeat => ({
  duration,
  notes: [],
});

export const bar = (
  beats: TablatureBeat[],
  timeSignature: [number, number] = [4, 4],
): TablatureMeasure => ({ timeSignature, beats });

/**
 * A power chord rooted on `rootString` at `fret`: root and fifth, plus the
 * octave when `size` is 3. An open root keeps the same shape (0-2-2).
 */
export const powerChord = (
  rootString: number,
  fret: number,
  size: 2 | 3 = 2,
): TablatureNote[] => {
  const shape = [
    note(rootString, fret),
    note(rootString - 1, fret + 2),
    note(rootString - 2, fret + 2),
  ];
  return shape.slice(0, size);
};
