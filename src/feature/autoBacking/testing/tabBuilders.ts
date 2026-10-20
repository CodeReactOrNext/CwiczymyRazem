import type {
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

/** [string, fret, duration] — one single-note beat. `null` string = a rest. */
export type BeatSpec = [number | null, number, number];

/** A bar of single notes (standard tuning: string 1 = high E). */
export function bar(
  beats: BeatSpec[],
  timeSignature: [number, number] = [4, 4],
  extra: Partial<TablatureMeasure> = {},
): TablatureMeasure {
  return {
    timeSignature,
    beats: beats.map(([string, fret, duration]) => ({
      duration,
      notes: string === null ? [] : [{ string, fret } as TablatureNote],
    })),
    ...extra,
  };
}

/** A bar holding one struck chord for its whole length. */
export function chordBar(
  notes: [number, number][],
  length = 4,
  chordName?: string,
): TablatureMeasure {
  return {
    timeSignature: [4, 4],
    beats: [
      {
        duration: length,
        ...(chordName ? { chordName } : {}),
        notes: notes.map(([string, fret]) => ({ string, fret })),
      },
    ],
  };
}

/** Eight eighths on the given [string, fret] cells, cycled. */
export const eighths = (cells: [number, number][]): BeatSpec[] =>
  Array.from(
    { length: 8 },
    (_, i) => [...cells[i % cells.length], 0.5] as BeatSpec,
  );

/** Sixteen sixteenths on the given cells, cycled. */
export const sixteenths = (cells: [number, number][]): BeatSpec[] =>
  Array.from(
    { length: 16 },
    (_, i) => [...cells[i % cells.length], 0.25] as BeatSpec,
  );

/** A minor pentatonic, box 1 at the 5th fret, low to high. */
export const A_MINOR_PENTATONIC_BOX: [number, number][] = [
  [6, 5],
  [6, 8],
  [5, 5],
  [5, 7],
  [4, 5],
  [4, 7],
  [3, 5],
  [3, 7],
  [2, 5],
  [2, 8],
  [1, 5],
  [1, 8],
];

/** The spider drill: frets 1-2-3-4 on every string. */
export const SPIDER: [number, number][] = [6, 5, 4, 3, 2, 1].flatMap((string) =>
  [1, 2, 3, 4].map((fret): [number, number] => [string, fret]),
);

/** Sum of a measure's beat durations — what the scheduler actually plays. */
export const lengthOf = (measure: TablatureMeasure) =>
  measure.beats.reduce((sum, beat) => sum + beat.duration, 0);
