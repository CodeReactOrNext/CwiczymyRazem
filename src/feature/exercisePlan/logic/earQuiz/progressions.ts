import { NOTES } from "utils/audio/noteUtils";

import type { ChordQualityId, DegreeId } from "./earQuiz.types";

interface DegreeSpec {
  /** Semitones above the key's tonic. */
  offset: number;
  quality: Extract<ChordQualityId, "major" | "minor" | "dim">;
}

export const DEGREES: Record<DegreeId, DegreeSpec> = {
  I: { offset: 0, quality: "major" },
  ii: { offset: 2, quality: "minor" },
  iii: { offset: 4, quality: "minor" },
  IV: { offset: 5, quality: "major" },
  V: { offset: 7, quality: "major" },
  vi: { offset: 9, quality: "minor" },
  "vii°": { offset: 11, quality: "dim" },
};

/** Tray order — always low-to-high degree, whatever order a config lists. */
const DEGREE_ORDER: DegreeId[] = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];

export const sortDegrees = (ids: DegreeId[]): DegreeId[] =>
  [...ids].sort((a, b) => DEGREE_ORDER.indexOf(a) - DEGREE_ORDER.indexOf(b));

export interface Progression {
  id: string;
  degrees: DegreeId[];
  /** Songs built on it — shown once the answer is revealed, so the shape sticks. */
  heardIn: string;
}

export const PROGRESSIONS: Progression[] = [
  // ── Three chords ───────────────────────────────────────────────────────────
  { id: "I-IV-V", degrees: ["I", "IV", "V"], heardIn: "Twist and Shout · La Bamba" },
  { id: "I-V-IV", degrees: ["I", "V", "IV"], heardIn: "Sweet Home Alabama" },
  { id: "I-vi-IV", degrees: ["I", "vi", "IV"], heardIn: "Every Breath You Take" },
  { id: "vi-IV-I", degrees: ["vi", "IV", "I"], heardIn: "Zombie · Save Tonight" },
  { id: "ii-V-I", degrees: ["ii", "V", "I"], heardIn: "The jazz turnaround" },

  // ── Four chords ────────────────────────────────────────────────────────────
  { id: "I-V-vi-IV", degrees: ["I", "V", "vi", "IV"], heardIn: "Let It Be · With or Without You" },
  { id: "I-vi-IV-V", degrees: ["I", "vi", "IV", "V"], heardIn: "Stand By Me · doo-wop" },
  { id: "vi-IV-I-V", degrees: ["vi", "IV", "I", "V"], heardIn: "Grenade · Africa" },
  { id: "I-IV-vi-V", degrees: ["I", "IV", "vi", "V"], heardIn: "She Will Be Loved" },
  { id: "I-vi-ii-V", degrees: ["I", "vi", "ii", "V"], heardIn: "Blue Moon · Heart and Soul" },
  { id: "IV-I-V-vi", degrees: ["IV", "I", "V", "vi"], heardIn: "Umbrella" },

  // ── Four chords, with the mediant in play ──────────────────────────────────
  { id: "I-iii-IV-V", degrees: ["I", "iii", "IV", "V"], heardIn: "Crocodile Rock" },
  { id: "iii-vi-ii-V", degrees: ["iii", "vi", "ii", "V"], heardIn: "The long jazz turnaround" },
  { id: "I-V-vi-iii", degrees: ["I", "V", "vi", "iii"], heardIn: "Canon in D" },
  { id: "vi-V-IV-iii", degrees: ["vi", "V", "IV", "iii"], heardIn: "The Andalusian descent" },
];

export const findProgression = (id: string): Progression | undefined =>
  PROGRESSIONS.find((p) => p.id === id);

/** Degrees written the way the answer reads back: "I – V – vi – IV". */
export const formatDegrees = (degrees: DegreeId[]): string => degrees.join(" – ");

export const midiToNoteName = (midi: number): string => NOTES[((midi % 12) + 12) % 12];

export interface ProgressionChord {
  degree: DegreeId;
  /** Chord symbol in the drawn key, e.g. "Am". */
  name: string;
  /** Bass note plus a close triad above it. */
  midis: number[];
}

const TRIADS: Record<DegreeSpec["quality"], number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
};

const SUFFIX: Record<DegreeSpec["quality"], string> = { major: "", minor: "m", dim: "dim" };

/**
 * Sound a progression in a given key: every chord gets a bass note an octave
 * under a close triad, so the tonic is audible as a tonic and the player is
 * hearing function rather than raw chord colour.
 */
export const buildProgressionChords = (keyRootMidi: number, degrees: DegreeId[]): ProgressionChord[] =>
  degrees.map((degree) => {
    const { offset, quality } = DEGREES[degree];
    const root = keyRootMidi + offset;
    return {
      degree,
      name: `${midiToNoteName(root)}${SUFFIX[quality]}`,
      midis: [root - 12, ...TRIADS[quality].map((semitones) => root + semitones)],
    };
  });
