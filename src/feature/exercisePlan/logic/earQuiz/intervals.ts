import type {
  IntervalDirection,
  IntervalId,
  PureIntervalId,
} from "./earQuiz.types";

export interface Interval {
  id: IntervalId;
  name: string;
  /** Scale-degree shorthand shown under the name, e.g. "♭3". */
  formula: string;
  /** Distance between the two notes. */
  semitones: number;
  character: string;
}

export const INTERVALS: Record<IntervalId, Interval> = {
  m2: {
    id: "m2",
    name: "Minor 2nd",
    formula: "♭2",
    semitones: 1,
    character: "One fret apart — the tightest, most tense step there is.",
  },
  M2: {
    id: "M2",
    name: "Major 2nd",
    formula: "2",
    semitones: 2,
    character: "Two frets — the plain step between neighbouring scale notes.",
  },
  m3: {
    id: "m3",
    name: "Minor 3rd",
    formula: "♭3",
    semitones: 3,
    character: "The sad third — the bottom of every minor chord.",
  },
  M3: {
    id: "M3",
    name: "Major 3rd",
    formula: "3",
    semitones: 4,
    character: "The bright third — the bottom of every major chord.",
  },
  P4: {
    id: "P4",
    name: "Perfect 4th",
    formula: "4",
    semitones: 5,
    character: "Open and solid — the gap between most neighbouring strings.",
  },
  TT: {
    id: "TT",
    name: "Tritone",
    formula: "♭5",
    semitones: 6,
    character: "Exactly half an octave — restless, it wants to resolve.",
  },
  P5: {
    id: "P5",
    name: "Perfect 5th",
    formula: "5",
    semitones: 7,
    character: "The power chord — hollow, strong and completely stable.",
  },
  m6: {
    id: "m6",
    name: "Minor 6th",
    formula: "♭6",
    semitones: 8,
    character: "A wide, aching leap — a major 3rd turned upside down.",
  },
  M6: {
    id: "M6",
    name: "Major 6th",
    formula: "6",
    semitones: 9,
    character: "A wide, sweet leap — warm rather than tense.",
  },
  m7: {
    id: "m7",
    name: "Minor 7th",
    formula: "♭7",
    semitones: 10,
    character: "The bluesy seventh — two frets short of the octave.",
  },
  M7: {
    id: "M7",
    name: "Major 7th",
    formula: "7",
    semitones: 11,
    character: "One fret short of the octave — sharp and yearning.",
  },
  P8: {
    id: "P8",
    name: "Octave",
    formula: "8",
    semitones: 12,
    character: "The same note again, higher — it blends completely.",
  },
};

/** Answer buttons run narrow to wide whatever order the exercise config lists. */
export const sortIntervals = (ids: IntervalId[]): IntervalId[] =>
  [...ids].sort((a, b) => INTERVALS[a].semitones - INTERVALS[b].semitones);

/**
 * The two notes in the order they sound. The root is the note the interval is
 * measured from: the first one heard going up, the top one coming down, and the
 * lower of the two when they are struck together.
 */
export const buildIntervalMidi = (
  rootMidi: number,
  interval: IntervalId,
  direction: IntervalDirection,
): [number, number] => {
  const { semitones } = INTERVALS[interval];
  return direction === "descending"
    ? [rootMidi, rootMidi - semitones]
    : [rootMidi, rootMidi + semitones];
};

/**
 * The intervals two sustained notes can be tuned to by ear: at a whole-number
 * frequency ratio their overtones line up and the beating between them stops.
 * `ratio` is upper note : lower note. The octave, 5th and 4th are the ones a
 * guitar is tuned with, and the only ones whose pure tuning sits within a
 * couple of cents of the fretted one — a pure major 3rd is 14 cents flat of it,
 * so "no beating" and "in tune with the frets" would be different answers.
 */
export const PURE_INTERVALS: Record<PureIntervalId, [number, number]> = {
  P8: [2, 1],
  P5: [3, 2],
  P4: [4, 3],
};

/** How far above the lower note a pure interval's upper note sits, in cents. */
export const pureIntervalCents = (interval: PureIntervalId): number => {
  const [upper, lower] = PURE_INTERVALS[interval];
  return 1200 * Math.log2(upper / lower);
};
