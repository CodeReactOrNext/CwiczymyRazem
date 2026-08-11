import type { ChordQualityId } from "./earQuiz.types";

export interface ChordQuality {
  id: ChordQualityId;
  /** Full name on the answer button. */
  name: string;
  /** Chord-symbol suffix appended to the root (C, Cm, C7, Cmaj7 …). */
  suffix: string;
  /** Semitones above the root, root included. */
  intervals: number[];
  /** Interval formula shown after the answer — what actually made the sound. */
  formula: string;
  /** One line on what it sounds like, shown when the answer is revealed. */
  character: string;
}

export const CHORD_QUALITIES: Record<ChordQualityId, ChordQuality> = {
  major: {
    id: "major",
    name: "Major",
    suffix: "",
    intervals: [0, 4, 7],
    formula: "1 · 3 · 5",
    character: "Bright and settled — the plain, happy triad.",
  },
  minor: {
    id: "minor",
    name: "Minor",
    suffix: "m",
    intervals: [0, 3, 7],
    formula: "1 · ♭3 · 5",
    character: "Darker than major, but just as settled — the flat 3rd does it.",
  },
  dom7: {
    id: "dom7",
    name: "Dominant 7",
    suffix: "7",
    intervals: [0, 4, 7, 10],
    formula: "1 · 3 · 5 · ♭7",
    character: "Major with an itch — bluesy, and it wants to resolve.",
  },
  maj7: {
    id: "maj7",
    name: "Major 7",
    suffix: "maj7",
    intervals: [0, 4, 7, 11],
    formula: "1 · 3 · 5 · 7",
    character: "Dreamy and floating — the 7th sits a semitone under the root.",
  },
  min7: {
    id: "min7",
    name: "Minor 7",
    suffix: "m7",
    intervals: [0, 3, 7, 10],
    formula: "1 · ♭3 · 5 · ♭7",
    character: "Smooth and mellow — minor with the edge taken off.",
  },
  dim: {
    id: "dim",
    name: "Diminished",
    suffix: "dim",
    intervals: [0, 3, 6],
    formula: "1 · ♭3 · ♭5",
    character: "Tense and unstable — the squashed 5th makes it ache.",
  },
  sus4: {
    id: "sus4",
    name: "Sus4",
    suffix: "sus4",
    intervals: [0, 5, 7],
    formula: "1 · 4 · 5",
    character: "Neither happy nor sad — the 3rd is missing, so it hangs.",
  },
  sus2: {
    id: "sus2",
    name: "Sus2",
    suffix: "sus2",
    intervals: [0, 2, 7],
    formula: "1 · 2 · 5",
    character: "Open and airy — a 2nd stands in for the 3rd.",
  },
};

/** Answer buttons keep this order whatever order the exercise config lists. */
const QUALITY_ORDER: ChordQualityId[] = [
  "major",
  "minor",
  "dom7",
  "maj7",
  "min7",
  "dim",
  "sus4",
  "sus2",
];

export const sortChordQualities = (ids: ChordQualityId[]): ChordQualityId[] =>
  [...ids].sort((a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b));

/**
 * Voice a chord as MIDI notes: the root, then every chord tone stacked above it.
 * Deliberately a plain close voicing rather than a guitar grip — the point is to
 * hear the quality, not to recognise a shape.
 */
export const buildChordMidi = (rootMidi: number, quality: ChordQualityId): number[] =>
  CHORD_QUALITIES[quality].intervals.map((semitones) => rootMidi + semitones);
