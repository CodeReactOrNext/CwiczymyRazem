// Music theory the backing generator reasons with: pitch classes, the scales a
// tab can be in, the chords each of those scales offers, and the stock
// progressions players expect to hear over them.

/** 0–11, C = 0. */
export type PitchClass = number;

export const pcOf = (midi: number): PitchClass => ((midi % 12) + 12) % 12;

const SHARP_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const FLAT_NAMES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

// ── Chords ────────────────────────────────────────────────────────────────────

/**
 * The triads and sevenths the harmonizer chooses from, plus the colours the
 * pad dresses them in (add9, 6, m9…). Ninths are written an octave up (14) so
 * a voicing spreads instead of bunching into a cluster.
 */
export type ChordQuality =
  | "maj"
  | "min"
  | "dim"
  | "5"
  | "7"
  | "min7"
  | "maj7"
  | "add9"
  | "6"
  | "min9"
  | "madd9"
  | "sus2"
  | "9"
  | "m7b5";

export const QUALITY_INTERVALS: Record<ChordQuality, readonly number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  "5": [0, 7],
  "7": [0, 4, 7, 10],
  min7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  add9: [0, 4, 7, 14],
  "6": [0, 4, 7, 9],
  // The fifth adds nothing to a minor ninth but mud; the colour is in the rest.
  min9: [0, 3, 10, 14],
  madd9: [0, 3, 7, 14],
  // Root, fifth, ninth: the open, third-less chord ambient pads live on.
  sus2: [0, 7, 14],
  "9": [0, 4, 10, 14],
  m7b5: [0, 3, 6, 10],
};

const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  maj: "",
  min: "m",
  dim: "dim",
  "5": "5",
  "7": "7",
  min7: "m7",
  maj7: "maj7",
  add9: "add9",
  "6": "6",
  min9: "m9",
  madd9: "m(add9)",
  sus2: "sus2",
  "9": "9",
  m7b5: "m7b5",
};

export interface Chord {
  root: PitchClass;
  quality: ChordQuality;
}

export const sameChord = (a: Chord, b: Chord) =>
  a.root === b.root && a.quality === b.quality;

export const chordTonesOf = (chord: Chord): PitchClass[] =>
  QUALITY_INTERVALS[chord.quality].map(
    (interval) => (chord.root + interval) % 12,
  );

/** Does the chord carry a third — i.e. say major or minor out loud? */
export const hasThird = (quality: ChordQuality) =>
  quality !== "5" && quality !== "sus2";

// ── Scales ────────────────────────────────────────────────────────────────────

/** The harmonic world a key builds its chords from. Pentatonics borrow their
 *  parent mode's chords; the blues builds on dominant sevenths. */
export type ChordScaleId =
  | "ionian"
  | "aeolian"
  | "dorian"
  | "mixolydian"
  | "phrygian"
  | "lydian"
  | "harmonicMinor"
  | "blues";

export type ScaleId =
  | "major"
  | "minor"
  | "dorian"
  | "mixolydian"
  | "phrygian"
  | "lydian"
  | "harmonicMinor"
  | "majorPentatonic"
  | "minorPentatonic"
  | "blues";

export interface ScaleDef {
  id: ScaleId;
  label: string;
  intervals: readonly number[];
  chordScale: ChordScaleId;
  /** How readily to believe this scale when several fit the notes equally. */
  prior: number;
}

export const SCALES: readonly ScaleDef[] = [
  {
    id: "major",
    label: "major",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    chordScale: "ionian",
    prior: 1,
  },
  {
    id: "minor",
    label: "minor",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    chordScale: "aeolian",
    prior: 1,
  },
  {
    id: "dorian",
    label: "dorian",
    intervals: [0, 2, 3, 5, 7, 9, 10],
    chordScale: "dorian",
    prior: 0.8,
  },
  {
    id: "mixolydian",
    label: "mixolydian",
    intervals: [0, 2, 4, 5, 7, 9, 10],
    chordScale: "mixolydian",
    prior: 0.8,
  },
  {
    id: "phrygian",
    label: "phrygian",
    intervals: [0, 1, 3, 5, 7, 8, 10],
    chordScale: "phrygian",
    prior: 0.7,
  },
  {
    id: "lydian",
    label: "lydian",
    intervals: [0, 2, 4, 6, 7, 9, 11],
    chordScale: "lydian",
    prior: 0.65,
  },
  {
    id: "harmonicMinor",
    label: "harmonic minor",
    intervals: [0, 2, 3, 5, 7, 8, 11],
    chordScale: "harmonicMinor",
    prior: 0.75,
  },
  {
    id: "majorPentatonic",
    label: "major pentatonic",
    intervals: [0, 2, 4, 7, 9],
    chordScale: "ionian",
    prior: 1,
  },
  {
    id: "minorPentatonic",
    label: "minor pentatonic",
    intervals: [0, 3, 5, 7, 10],
    chordScale: "aeolian",
    prior: 1,
  },
  {
    id: "blues",
    label: "blues",
    intervals: [0, 3, 5, 6, 7, 10],
    chordScale: "blues",
    prior: 0.85,
  },
];

export const scaleById = (id: ScaleId): ScaleDef =>
  SCALES.find((scale) => scale.id === id)!;

/** Minor-flavoured chord scales — their tonic chord is minor. */
const MINOR_CHORD_SCALES: ReadonlySet<ChordScaleId> = new Set([
  "aeolian",
  "dorian",
  "phrygian",
  "harmonicMinor",
]);
export const isMinorChordScale = (id: ChordScaleId) =>
  MINOR_CHORD_SCALES.has(id);

/** Flat spelling reads right in keys whose signature has flats (F major, D minor…). */
export function usesFlats(
  tonic: PitchClass,
  chordScale: ChordScaleId,
): boolean {
  // Relative-major tonic of the key, so modes share their parent's spelling.
  const toParentMajor: Record<ChordScaleId, number> = {
    ionian: 0,
    lydian: 7,
    mixolydian: 5,
    blues: 0,
    dorian: 10,
    aeolian: 3,
    harmonicMinor: 3,
    phrygian: 8,
  };
  const parent = (tonic + toParentMajor[chordScale]) % 12;
  // F, Bb, Eb, Ab, Db, Gb majors are written with flats.
  return [5, 10, 3, 8, 1, 6].includes(parent);
}

export const pcName = (pc: PitchClass, flats = false) =>
  (flats ? FLAT_NAMES : SHARP_NAMES)[pcOf(pc)];

export const chordSymbol = (chord: Chord, flats = false) =>
  pcName(chord.root, flats) + QUALITY_SUFFIX[chord.quality];

// ── Chord vocabulary per scale ────────────────────────────────────────────────

export interface DegreeChord {
  /** Roman numeral as players say it: "bVII", "iv", "V7". */
  degree: string;
  /** Semitones above the tonic. */
  offset: number;
  quality: ChordQuality;
  /** How common the chord is in this key — the harmonizer's prior. */
  prior: number;
}

const VOCABULARY: Record<ChordScaleId, readonly DegreeChord[]> = {
  ionian: [
    { degree: "I", offset: 0, quality: "maj", prior: 1 },
    { degree: "ii", offset: 2, quality: "min", prior: 0.55 },
    { degree: "iii", offset: 4, quality: "min", prior: 0.35 },
    { degree: "IV", offset: 5, quality: "maj", prior: 0.85 },
    { degree: "V", offset: 7, quality: "maj", prior: 0.85 },
    { degree: "vi", offset: 9, quality: "min", prior: 0.75 },
  ],
  aeolian: [
    { degree: "i", offset: 0, quality: "min", prior: 1 },
    { degree: "bIII", offset: 3, quality: "maj", prior: 0.6 },
    { degree: "iv", offset: 5, quality: "min", prior: 0.75 },
    { degree: "v", offset: 7, quality: "min", prior: 0.45 },
    { degree: "bVI", offset: 8, quality: "maj", prior: 0.8 },
    { degree: "bVII", offset: 10, quality: "maj", prior: 0.85 },
  ],
  dorian: [
    { degree: "i", offset: 0, quality: "min", prior: 1 },
    { degree: "ii", offset: 2, quality: "min", prior: 0.45 },
    { degree: "bIII", offset: 3, quality: "maj", prior: 0.55 },
    { degree: "IV", offset: 5, quality: "maj", prior: 0.85 },
    { degree: "v", offset: 7, quality: "min", prior: 0.45 },
    { degree: "bVII", offset: 10, quality: "maj", prior: 0.7 },
  ],
  mixolydian: [
    { degree: "I", offset: 0, quality: "maj", prior: 1 },
    { degree: "ii", offset: 2, quality: "min", prior: 0.4 },
    { degree: "IV", offset: 5, quality: "maj", prior: 0.8 },
    { degree: "v", offset: 7, quality: "min", prior: 0.5 },
    { degree: "vi", offset: 9, quality: "min", prior: 0.4 },
    { degree: "bVII", offset: 10, quality: "maj", prior: 0.9 },
  ],
  phrygian: [
    { degree: "i", offset: 0, quality: "min", prior: 1 },
    { degree: "bII", offset: 1, quality: "maj", prior: 0.9 },
    { degree: "bIII", offset: 3, quality: "maj", prior: 0.6 },
    { degree: "iv", offset: 5, quality: "min", prior: 0.5 },
    { degree: "bVI", offset: 8, quality: "maj", prior: 0.6 },
    { degree: "bvii", offset: 10, quality: "min", prior: 0.55 },
  ],
  lydian: [
    { degree: "I", offset: 0, quality: "maj", prior: 1 },
    { degree: "II", offset: 2, quality: "maj", prior: 0.9 },
    { degree: "iii", offset: 4, quality: "min", prior: 0.4 },
    { degree: "V", offset: 7, quality: "maj", prior: 0.6 },
    { degree: "vi", offset: 9, quality: "min", prior: 0.5 },
    { degree: "vii", offset: 11, quality: "min", prior: 0.45 },
  ],
  harmonicMinor: [
    { degree: "i", offset: 0, quality: "min", prior: 1 },
    { degree: "iv", offset: 5, quality: "min", prior: 0.8 },
    { degree: "V", offset: 7, quality: "maj", prior: 0.9 },
    { degree: "bVI", offset: 8, quality: "maj", prior: 0.75 },
  ],
  blues: [
    { degree: "I7", offset: 0, quality: "7", prior: 1 },
    { degree: "IV7", offset: 5, quality: "7", prior: 0.9 },
    { degree: "V7", offset: 7, quality: "7", prior: 0.8 },
  ],
};

export const vocabularyFor = (
  chordScale: ChordScaleId,
): readonly DegreeChord[] => VOCABULARY[chordScale];

export const chordOfDegree = (
  tonic: PitchClass,
  degree: DegreeChord,
): Chord => ({
  root: (tonic + degree.offset) % 12,
  quality: degree.quality,
});

// ── Stock progressions ────────────────────────────────────────────────────────

export interface ProgressionTemplate {
  /** One degree per bar, looped over the backing. */
  degrees: readonly string[];
  /** How idiomatic the progression is — the stronger, the more it is preferred
   *  over simply holding the tonic when the melody would accept either. */
  prior: number;
}

const TEMPLATES: Record<ChordScaleId, readonly ProgressionTemplate[]> = {
  ionian: [
    { degrees: ["I", "IV"], prior: 0.7 },
    { degrees: ["I", "vi"], prior: 0.6 },
    { degrees: ["I", "V"], prior: 0.6 },
    { degrees: ["I", "IV", "V", "IV"], prior: 0.8 },
    { degrees: ["I", "V", "vi", "IV"], prior: 0.9 },
    { degrees: ["I", "vi", "IV", "V"], prior: 0.85 },
    { degrees: ["I", "IV", "I", "V"], prior: 0.75 },
    { degrees: ["I", "vi", "ii", "V"], prior: 0.7 },
  ],
  aeolian: [
    { degrees: ["i", "bVII"], prior: 0.75 },
    { degrees: ["i", "iv"], prior: 0.7 },
    { degrees: ["i", "bVI"], prior: 0.7 },
    { degrees: ["i", "bVI", "bVII", "i"], prior: 0.85 },
    { degrees: ["i", "bVII", "bVI", "bVII"], prior: 0.85 },
    { degrees: ["i", "bVI", "bIII", "bVII"], prior: 0.8 },
    { degrees: ["i", "iv", "bVII", "i"], prior: 0.7 },
    { degrees: ["i", "iv", "v", "i"], prior: 0.65 },
  ],
  dorian: [
    { degrees: ["i", "IV"], prior: 0.85 },
    { degrees: ["i", "bVII", "IV", "i"], prior: 0.7 },
    { degrees: ["i", "ii"], prior: 0.55 },
  ],
  mixolydian: [
    { degrees: ["I", "bVII"], prior: 0.85 },
    { degrees: ["I", "bVII", "IV", "I"], prior: 0.8 },
    { degrees: ["I", "IV", "bVII", "IV"], prior: 0.7 },
  ],
  phrygian: [
    { degrees: ["i", "bII"], prior: 0.85 },
    { degrees: ["i", "bII", "bIII", "bII"], prior: 0.7 },
  ],
  lydian: [{ degrees: ["I", "II"], prior: 0.85 }],
  harmonicMinor: [
    { degrees: ["i", "V"], prior: 0.8 },
    { degrees: ["i", "iv", "V", "i"], prior: 0.8 },
    { degrees: ["i", "bVI", "V", "i"], prior: 0.75 },
  ],
  blues: [
    { degrees: ["I7", "IV7"], prior: 0.7 },
    // The quick-change twelve-bar — what "a blues" means to most players.
    {
      degrees: [
        "I7",
        "IV7",
        "I7",
        "I7",
        "IV7",
        "IV7",
        "I7",
        "I7",
        "V7",
        "IV7",
        "I7",
        "V7",
      ],
      prior: 1,
    },
  ],
};

export const templatesFor = (
  chordScale: ChordScaleId,
): readonly ProgressionTemplate[] => TEMPLATES[chordScale];
