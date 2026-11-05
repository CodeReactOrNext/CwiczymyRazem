import type {
  Exercise,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

// Open chords and their sus / add9 ornaments, with the fretting finger on every
// fretted note so the session's hand shows which finger joins or lets go.
// Strings: 1 = high e … 6 = low E; open strings carry no finger.
type Grip = TablatureNote[];

// Each grip carries its chord symbol: shown over the tab, and read by the
// generated backing so its pad follows the ornaments instead of guessing them.
const GRIP_NAMES = new WeakMap<Grip, string>();
const grip = (name: string, notes: Grip): Grip => {
  GRIP_NAMES.set(notes, name);
  return notes;
};

const D = grip("D", [
  { string: 4, fret: 0 },
  { string: 3, fret: 2, finger: 1 },
  { string: 2, fret: 3, finger: 3 },
  { string: 1, fret: 2, finger: 2 },
]);
const DSUS4 = grip("Dsus4", [
  { string: 4, fret: 0 },
  { string: 3, fret: 2, finger: 1 },
  { string: 2, fret: 3, finger: 3 },
  { string: 1, fret: 3, finger: 4 },
]);
const DSUS2 = grip("Dsus2", [
  { string: 4, fret: 0 },
  { string: 3, fret: 2, finger: 1 },
  { string: 2, fret: 3, finger: 3 },
  { string: 1, fret: 0 },
]);

const A = grip("A", [
  { string: 5, fret: 0 },
  { string: 4, fret: 2, finger: 1 },
  { string: 3, fret: 2, finger: 2 },
  { string: 2, fret: 2, finger: 3 },
  { string: 1, fret: 0 },
]);
const ASUS4 = grip("Asus4", [
  { string: 5, fret: 0 },
  { string: 4, fret: 2, finger: 1 },
  { string: 3, fret: 2, finger: 2 },
  { string: 2, fret: 3, finger: 4 },
  { string: 1, fret: 0 },
]);
const ASUS2 = grip("Asus2", [
  { string: 5, fret: 0 },
  { string: 4, fret: 2, finger: 1 },
  { string: 3, fret: 2, finger: 2 },
  { string: 2, fret: 0 },
  { string: 1, fret: 0 },
]);

const E = grip("E", [
  { string: 6, fret: 0 },
  { string: 5, fret: 2, finger: 2 },
  { string: 4, fret: 2, finger: 3 },
  { string: 3, fret: 1, finger: 1 },
  { string: 2, fret: 0 },
  { string: 1, fret: 0 },
]);
const ESUS4 = grip("Esus4", [
  { string: 6, fret: 0 },
  { string: 5, fret: 2, finger: 2 },
  { string: 4, fret: 2, finger: 3 },
  { string: 3, fret: 2, finger: 4 },
  { string: 2, fret: 0 },
  { string: 1, fret: 0 },
]);

// Am keeps the 2-3-1 grip, so its sus shapes trade the index for the pinky.
const AM = grip("Am", [
  { string: 5, fret: 0 },
  { string: 4, fret: 2, finger: 2 },
  { string: 3, fret: 2, finger: 3 },
  { string: 2, fret: 1, finger: 1 },
  { string: 1, fret: 0 },
]);
const AM_SUS4 = grip("Asus4", [
  { string: 5, fret: 0 },
  { string: 4, fret: 2, finger: 2 },
  { string: 3, fret: 2, finger: 3 },
  { string: 2, fret: 3, finger: 4 },
  { string: 1, fret: 0 },
]);
const AM_SUS2 = grip("Asus2", [
  { string: 5, fret: 0 },
  { string: 4, fret: 2, finger: 2 },
  { string: 3, fret: 2, finger: 3 },
  { string: 2, fret: 0 },
  { string: 1, fret: 0 },
]);

const C = grip("C", [
  { string: 5, fret: 3, finger: 3 },
  { string: 4, fret: 2, finger: 2 },
  { string: 3, fret: 0 },
  { string: 2, fret: 1, finger: 1 },
  { string: 1, fret: 0 },
]);
const CSUS4 = grip("Csus4", [
  { string: 5, fret: 3, finger: 3 },
  { string: 4, fret: 3, finger: 4 },
  { string: 3, fret: 0 },
  { string: 2, fret: 1, finger: 1 },
  { string: 1, fret: 0 },
]);
const CADD9 = grip("Cadd9", [
  { string: 5, fret: 3, finger: 3 },
  { string: 4, fret: 2, finger: 2 },
  { string: 3, fret: 0 },
  { string: 2, fret: 3, finger: 4 },
  { string: 1, fret: 0 },
]);

// G fingered 3-2-4 leaves the index free to add the sus4 on B.
const G = grip("G", [
  { string: 6, fret: 3, finger: 3 },
  { string: 5, fret: 2, finger: 2 },
  { string: 4, fret: 0 },
  { string: 3, fret: 0 },
  { string: 2, fret: 0 },
  { string: 1, fret: 3, finger: 4 },
]);
const GSUS4 = grip("Gsus4", [
  { string: 6, fret: 3, finger: 3 },
  { string: 5, fret: 2, finger: 2 },
  { string: 4, fret: 0 },
  { string: 3, fret: 0 },
  { string: 2, fret: 1, finger: 1 },
  { string: 1, fret: 3, finger: 4 },
]);

/**
 * Grips that ring: one strum per half note, two to a 4/4 bar. Ornaments need
 * time to be heard, so a chord and its three ornaments take two bars.
 */
const ringing = (...grips: Grip[]): TablatureMeasure[] => {
  const bars: TablatureMeasure[] = [];
  for (let i = 0; i < grips.length; i += 2) {
    bars.push({
      timeSignature: [4, 4],
      beats: grips.slice(i, i + 2).map((notes) => ({
        duration: 2,
        chordName: GRIP_NAMES.get(notes),
        notes: notes.map((n) => ({ ...n })),
      })),
    });
  }
  return bars;
};

export const susOrnamentsDAEExercise: Exercise = {
  id: "sus_ornaments_d_a_e",
  title: "Sus Ornaments — D, A, E",
  description:
    "Hold D, A and E while one finger adds or lifts a note on top, turning each chord into a small melody of sus2 and sus4 colours.",
  whyItMatters:
    "Sus2 and sus4 ornaments are how a plain chord starts to sound like a song: one finger moves while the rest of the grip keeps ringing. It is also the first step of finger independence inside a chord. Playing them trains you to keep a shape pressed and clean while a single finger works next to it, without muting the neighbouring strings.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 3,
  instructions: [
    "Strum each grip once and let it ring for two metronome clicks. Each chord takes two bars: chord, ornament, chord, ornament.",
    "D: the pinky adds high e fret 3 for Dsus4, then the middle finger lets go of e for Dsus2.",
    "A (fingers 1-2-3): the pinky takes B fret 3 for Asus4, then the ring finger lets go of B for Asus2.",
    "E: the pinky lands on G fret 2 while the index lifts — Esus4. The small number beside each note shows the finger.",
  ],
  tips: [
    "Keep the fingers that do not move pressed the whole bar — only one finger should change at a time.",
    "Let the moving finger come down on its fingertip, so it does not touch the string next to it.",
    "Strum slowly at first and listen to the top string: the ornament is the only note that changes.",
    "When the whole pass rings clean, raise the tempo by 5 BPM.",
  ],
  metronomeSpeed: {
    min: 50,
    max: 100,
    recommended: 60,
  },
  relatedSkills: ["chords"],
  tablature: [
    ...ringing(D, DSUS4, D, DSUS2),
    ...ringing(A, ASUS4, A, ASUS2),
    ...ringing(E, ESUS4, E, ESUS4),
    ...ringing(A, ASUS2, A, ASUS4),
  ],
};

export const susOrnamentsAmCGExercise: Exercise = {
  id: "sus_ornaments_am_c_g",
  title: "Sus Ornaments — Am, C, G",
  description:
    "Ornament Am, C and G with sus4, sus2 and add9 notes, where one finger hands its string over to another.",
  whyItMatters:
    "On Am, C and G the ornaments are not just one finger added: one finger lets go at the same moment another one lands, often on a different string. That swap is the real skill behind clean, musical chord playing. Practising it slowly on familiar grips makes the hand comfortable moving single fingers while the chord keeps sounding.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 3,
  instructions: [
    "Strum each grip once and let it ring for two metronome clicks. Each chord takes two bars: chord, ornament, chord, ornament.",
    "Am: the index lets go of B as the pinky lands on B fret 3 for Asus4; for Asus2 the index simply lets go.",
    "C: for Csus4 the middle finger lets go and the pinky takes D fret 3; for Cadd9 the index lets go and the pinky takes B fret 3.",
    "G is fingered 3-2-4, so the index is free to add B fret 1 for Gsus4. The small number beside each note shows the finger.",
  ],
  tips: [
    "Do the swap as one motion: the finger lifting and the finger landing should meet on the same click.",
    "Keep the ring finger on its bass note through C and G — it holds the chord in place.",
    "If a string dies when the pinky lands, arch the pinky more and press closer to the fret.",
    "When the whole pass rings clean, raise the tempo by 5 BPM.",
  ],
  metronomeSpeed: {
    min: 50,
    max: 100,
    recommended: 60,
  },
  relatedSkills: ["chords"],
  tablature: [
    ...ringing(AM, AM_SUS4, AM, AM_SUS2),
    ...ringing(C, CSUS4, C, CADD9),
    ...ringing(G, GSUS4, G, GSUS4),
    ...ringing(C, CADD9, C, CSUS4),
  ],
};

// A fingered 2-3-4 for the full progression: Esus4 (also 2-3-4 on the 2nd
// fret) slides one string over into it, and Asus4 is just the pinky moving up
// a fret.
const A_234 = grip("A", [
  { string: 5, fret: 0 },
  { string: 4, fret: 2, finger: 2 },
  { string: 3, fret: 2, finger: 3 },
  { string: 2, fret: 2, finger: 4 },
  { string: 1, fret: 0 },
]);
const ASUS4_234 = grip("Asus4", [
  { string: 5, fret: 0 },
  { string: 4, fret: 2, finger: 2 },
  { string: 3, fret: 2, finger: 3 },
  { string: 2, fret: 3, finger: 4 },
  { string: 1, fret: 0 },
]);
const ASUS2_234 = grip("Asus2", [
  { string: 5, fret: 0 },
  { string: 4, fret: 2, finger: 2 },
  { string: 3, fret: 2, finger: 3 },
  { string: 2, fret: 0 },
  { string: 1, fret: 0 },
]);

// C – Am, then a circle of fifths home: E – A – D – G – C, each chord the
// dominant of the next. The last grip of a chord bridges into the next one:
// Cadd9 → Asus4 keeps pinky and middle, Esus4 slides into A, Asus4 already
// holds the root of D, Dsus4 keeps the pinky on e for G, and Gsus4 puts the
// index where C wants it.
export const susOrnamentsFullProgressionExercise: Exercise = {
  id: "sus_ornaments_full_progression",
  title: "Sus Ornaments — Full Progression",
  description:
    "Every sus ornament from D, A, E, Am, C and G in one progression, each grip ringing for two beats, with sus shapes bridging the chord changes.",
  whyItMatters:
    "Ornaments only sound natural when they keep flowing through the chord changes. In this progression the sus shapes do double duty: they decorate each chord and they are the stepping stones into the next one, because they share fingers with it. Letting every grip ring for two beats gives the moving finger time to land cleanly while the hand already plans the next change, which is what real rhythm-guitar parts ask for.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 4,
  instructions: [
    "Strum each grip once and let it ring for two metronome clicks. Each chord takes two bars.",
    "The progression is C – Am – E – A – D – G and back to C. From E on, every chord is the dominant of the next one, so each change pulls into the following chord.",
    "A is fingered 2-3-4 here: Asus4 is the pinky moving up to B fret 3, Asus2 is the pinky letting go. G is 3-2-4, so the index is free for Gsus4.",
    "The last grip before a new chord often already belongs to it. The small number beside each note shows the finger.",
  ],
  tips: [
    "Cadd9 → Asus4: the pinky stays on B fret 3 and the middle on D fret 2 — only the ring finger moves.",
    "Dsus4 → G: keep the pinky on high e fret 3 — it is the same note in both shapes.",
    "Gsus4 → C: the index is already on B fret 1, and the ring finger only crosses from low E to A on the same fret.",
    "Esus4 → A: lift the flat 2-3-4 shape and set it down one string thinner. Start at 50 BPM and add 5 BPM when a whole pass is clean.",
  ],
  metronomeSpeed: {
    min: 40,
    max: 100,
    recommended: 50,
  },
  relatedSkills: ["chords", "finger_independence"],
  tablature: [
    ...ringing(C, CSUS4, C, CADD9),
    ...ringing(AM_SUS4, AM, AM_SUS2, AM),
    ...ringing(E, ESUS4, E, ESUS4),
    ...ringing(A_234, ASUS2_234, A_234, ASUS4_234),
    ...ringing(D, DSUS2, D, DSUS4),
    ...ringing(G, GSUS4, G, GSUS4),
  ],
};
