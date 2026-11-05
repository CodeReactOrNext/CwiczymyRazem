import type {
  Exercise,
  TablatureBeat,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

// Chord changes joined by a walking bass line, in C major / A minor. Every
// fretted note carries its finger, chosen so the ring finger mostly stays on
// the 3rd fret and fingers 1 and 2 stay put through Am ↔ C.
// Strings: 1 = high e … 6 = low E.
type Notes = TablatureNote[];

/** A single bass note. */
const bass = (string: number, fret: number, finger?: 1 | 2 | 3 | 4): Notes => [
  finger ? { string, fret, finger } : { string, fret },
];

// The "chick": the chord on the D, G, B and e strings.
const C_TOP: Notes = [
  { string: 4, fret: 2, finger: 2 },
  { string: 3, fret: 0 },
  { string: 2, fret: 1, finger: 1 },
  { string: 1, fret: 0 },
];
const G_TOP: Notes = [
  { string: 4, fret: 0 },
  { string: 3, fret: 0 },
  { string: 2, fret: 0 },
  { string: 1, fret: 3, finger: 4 },
];
const AM_TOP: Notes = [
  { string: 4, fret: 2, finger: 2 },
  { string: 3, fret: 2, finger: 3 },
  { string: 2, fret: 1, finger: 1 },
  { string: 1, fret: 0 },
];
const EM_TOP: Notes = [
  { string: 4, fret: 2, finger: 2 },
  { string: 3, fret: 0 },
  { string: 2, fret: 0 },
  { string: 1, fret: 0 },
];
const F_TOP: Notes = [
  { string: 4, fret: 3, finger: 4 },
  { string: 3, fret: 2, finger: 2 },
  { string: 2, fret: 1, finger: 1 },
  { string: 1, fret: 1, finger: 1 },
];
const E_TOP: Notes = [
  { string: 4, fret: 2, finger: 3 },
  { string: 3, fret: 1, finger: 1 },
  { string: 2, fret: 0 },
  { string: 1, fret: 0 },
];

// Bass notes, by name.
const C_BASS = bass(5, 3, 3);
const B_BASS_RING = bass(5, 2, 3);
const B_BASS_MIDDLE = bass(5, 2, 2);
const A_BASS = bass(5, 0);
const G_BASS = bass(6, 3, 3);
const F_BASS = bass(6, 1, 1);
const FS_BASS = bass(6, 2, 2);
const E_BASS = bass(6, 0);

/**
 * One 4/4 bar of quarter notes. `chords` names the chord at each beat, space
 * separated, "." where it carries on — shown over the tab and followed by the
 * generated backing, whose bass then plays the slash notes with the guitar.
 */
const bar = (chords: string, ...beats: Notes[]): TablatureMeasure => {
  const names = chords.split(" ");
  return {
    timeSignature: [4, 4],
    beats: beats.map((notes, i): TablatureBeat => {
      const name = names[i];
      return {
        duration: 1,
        ...(name && name !== "." ? { chordName: name } : {}),
        notes: notes.map((n) => ({ ...n })),
      };
    }),
  };
};

// Phrase 1 — the bass walks down the scale: C B A G F E F G.
const descendingScale: TablatureMeasure[] = [
  bar("C . G/B .", C_BASS, C_TOP, B_BASS_RING, G_TOP),
  bar("Am . Em/G .", A_BASS, AM_TOP, G_BASS, EM_TOP),
  bar("F . C/E .", F_BASS, F_TOP, E_BASS, C_TOP),
  bar("F . G .", F_BASS, F_TOP, G_BASS, G_TOP),
];

// Phrase 2 — Am held while the pinky walks the bass down by half steps:
// A G# G F#, then F, E and home to Am.
const chromaticLament: TablatureMeasure[] = [
  bar("Am . Am/G# .", A_BASS, AM_TOP, bass(6, 4, 4), AM_TOP),
  bar("Am/G . Am/F# .", bass(6, 3, 4), AM_TOP, bass(6, 2, 4), AM_TOP),
  bar("F . E .", F_BASS, F_TOP, E_BASS, E_TOP),
  bar("Am . . G/B", A_BASS, AM_TOP, AM_TOP, B_BASS_RING),
];

// Phrase 3 — one chord per bar, a passing bass note on beat 4 leads into the
// next. Each passing note is named as the chord it implies (G/B, Am/G, D/F#),
// so the backing harmonizes the step instead of clashing with it.
const passingNotes: TablatureMeasure[] = [
  bar("C . . G/B", C_BASS, C_TOP, C_TOP, B_BASS_RING),
  bar("Am . . Am/G", A_BASS, AM_TOP, AM_TOP, G_BASS),
  bar("F . . D/F#", F_BASS, F_TOP, F_TOP, FS_BASS),
  bar("G . Am G/B", G_BASS, G_TOP, A_BASS, B_BASS_MIDDLE),
];

export const bassLineChordChangesExercise: Exercise = {
  id: "bass_line_chord_changes",
  title: "Bass Line Chord Changes",
  description:
    "Join chords with a walking bass line in C major and A minor: a descending scale, a chromatic lament under Am, and passing notes into every change.",
  whyItMatters:
    "Changing chords on beat one is only half of accompaniment — good players connect them, so the bass sings a line of its own. That means fretting a bass note with one finger while the others hold, or are on their way to, the next grip. Training this builds real finger independence inside chords and makes simple progressions sound full and deliberate.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Phrases 1 and 2 give each chord two beats: the bass note, then the chord on the D, G, B and e strings.",
    "Phrase 1: the bass walks down C B A G F E, then F G. Phrase 2: keep the Am grip and walk the pinky down the low E string — frets 4, 3, 2 — before F, E and Am.",
    "Phrase 3: one chord per bar, and the bass note on beat 4 leads into the next chord.",
    "F is a full barre on the 1st fret. The small number beside each note shows the finger.",
  ],
  tips: [
    "The ring finger rarely leaves the 3rd fret: C, G/B, Em/G, F and G all hand it on along the same fret.",
    "Going Am → C, keep the index and middle down — only the ring finger walks from G fret 2 to A fret 2 and A fret 3.",
    "Play the bass note a little louder than the chord, so the line is easy to hear.",
    "Start at 40–50 BPM; when all twelve bars are clean, raise the tempo by 5 BPM.",
  ],
  metronomeSpeed: {
    min: 40,
    max: 90,
    recommended: 50,
  },
  relatedSkills: ["chords", "finger_independence"],
  tablature: [...descendingScale, ...chromaticLament, ...passingNotes],
};
