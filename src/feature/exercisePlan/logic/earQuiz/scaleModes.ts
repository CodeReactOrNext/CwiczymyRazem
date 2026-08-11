import type { ScaleModeId } from "./earQuiz.types";

export interface ScaleMode {
  id: ScaleModeId;
  name: string;
  /** Family the ear hears first — the 3rd decides it. */
  family: "major" | "minor";
  /** Degrees of the scale, e.g. "1 2 ♭3 4 5 6 ♭7". */
  formula: string;
  /** The one note that separates it from its nearest neighbour. */
  tell: string;
  character: string;
  /** Semitones above the root, one octave, root included. */
  intervals: number[];
}

export const SCALE_MODES: Record<ScaleModeId, ScaleMode> = {
  ionian: {
    id: "ionian",
    name: "Ionian (major)",
    family: "major",
    formula: "1 2 3 4 5 6 7",
    tell: "natural 4th and 7th",
    character: "The plain major scale — nothing pulls against the tonic.",
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },
  dorian: {
    id: "dorian",
    name: "Dorian",
    family: "minor",
    formula: "1 2 ♭3 4 5 6 ♭7",
    tell: "natural 6th",
    character: "Minor, but the raised 6th lifts it — funk, Santana, Moondance.",
    intervals: [0, 2, 3, 5, 7, 9, 10],
  },
  phrygian: {
    id: "phrygian",
    name: "Phrygian",
    family: "minor",
    formula: "1 ♭2 ♭3 4 5 ♭6 ♭7",
    tell: "♭2 right above the root",
    character: "Darkest of the minor modes — Spanish and metal both live here.",
    intervals: [0, 1, 3, 5, 7, 8, 10],
  },
  lydian: {
    id: "lydian",
    name: "Lydian",
    family: "major",
    formula: "1 2 3 #4 5 6 7",
    tell: "raised 4th",
    character: "Major with a lift — floating, cinematic, weightless.",
    intervals: [0, 2, 4, 6, 7, 9, 11],
  },
  mixolydian: {
    id: "mixolydian",
    name: "Mixolydian",
    family: "major",
    formula: "1 2 3 4 5 6 ♭7",
    tell: "♭7",
    character: "Major with a flat 7th — the rock and blues major.",
    intervals: [0, 2, 4, 5, 7, 9, 10],
  },
  aeolian: {
    id: "aeolian",
    name: "Aeolian (natural minor)",
    family: "minor",
    formula: "1 2 ♭3 4 5 ♭6 ♭7",
    tell: "♭6",
    character: "Plain natural minor — sad and settled.",
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  locrian: {
    id: "locrian",
    name: "Locrian",
    family: "minor",
    formula: "1 ♭2 ♭3 4 ♭5 ♭6 ♭7",
    tell: "♭5 — no stable home",
    character: "Never lands: the 5th itself is flattened.",
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },
  harmonicMinor: {
    id: "harmonicMinor",
    name: "Harmonic minor",
    family: "minor",
    formula: "1 2 ♭3 4 5 ♭6 7",
    tell: "big jump between ♭6 and 7",
    character: "Minor with a raised 7th — the exotic leap near the top.",
    intervals: [0, 2, 3, 5, 7, 8, 11],
  },
};

/** Answer buttons keep this order whatever order the exercise config lists. */
const MODE_ORDER: ScaleModeId[] = [
  "ionian",
  "lydian",
  "mixolydian",
  "dorian",
  "aeolian",
  "phrygian",
  "locrian",
  "harmonicMinor",
];

export const sortScaleModes = (ids: ScaleModeId[]): ScaleModeId[] =>
  [...ids].sort((a, b) => MODE_ORDER.indexOf(a) - MODE_ORDER.indexOf(b));

/** One octave ascending, root repeated on top so the run resolves. */
export const buildScaleMidi = (
  rootMidi: number,
  scale: ScaleModeId,
): number[] => [
  ...SCALE_MODES[scale].intervals.map((semitones) => rootMidi + semitones),
  rootMidi + 12,
];

/**
 * Root and 5th under the run. Without a drone a mode is unidentifiable — Dorian
 * and Aeolian are the same seven notes from a different starting point, so the
 * tonic has to be held for the ear to have anything to measure against.
 */
export const buildDroneMidi = (rootMidi: number): number[] => [
  rootMidi - 12,
  rootMidi - 5,
];
