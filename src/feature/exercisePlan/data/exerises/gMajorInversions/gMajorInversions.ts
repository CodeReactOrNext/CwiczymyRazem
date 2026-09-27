import type {
  Exercise,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

// One chord every two bars: strike on beat 1, let it ring through the next bar.
export const heldChord = (chordName: string, notes: TablatureNote[]): TablatureMeasure[] => [
  {
    timeSignature: [4, 4],
    beats: [{ duration: 4, chordName, notes: notes.map((note) => ({ ...note, isLetRing: true })) }],
  },
  { timeSignature: [4, 4], beats: [{ duration: 4, notes: [] }] },
];

// G — root position, open (3-2-0-0-0-3)
const openShape = heldChord("G", [
  { string: 6, fret: 3 },
  { string: 5, fret: 2 },
  { string: 4, fret: 0 },
  { string: 3, fret: 0 },
  { string: 2, fret: 0 },
  { string: 1, fret: 3 },
]);
// G — E-shape barre (3-5-5-4-3-3)
const barreShape = heldChord("G", [
  { string: 6, fret: 3 },
  { string: 5, fret: 5 },
  { string: 4, fret: 5 },
  { string: 3, fret: 4 },
  { string: 2, fret: 3 },
  { string: 1, fret: 3 },
]);
// G — C-shape (x-10-9-7-8-7)
const cShape = heldChord("G", [
  { string: 5, fret: 10 },
  { string: 4, fret: 9 },
  { string: 3, fret: 7 },
  { string: 2, fret: 8 },
  { string: 1, fret: 7 },
]);
// G — A-shape barre (x-10-12-12-12-10)
const aShape = heldChord("G", [
  { string: 5, fret: 10 },
  { string: 4, fret: 12 },
  { string: 3, fret: 12 },
  { string: 2, fret: 12 },
  { string: 1, fret: 10 },
]);

export const gMajorInversionsExercise: Exercise = {
  id: "g_major_inversions",
  title: "Chords — Major Position",
  description:
    "Walk one G major chord up the neck through four voicings — open, barre, C-shape and A-shape — then back down the same way, holding each for two bars.",
  whyItMatters:
    "The same three notes (G, B, D) can be stacked in many ways across the neck. Knowing several voicings of one chord lets you pick the shape closest to your hand, build smoother progressions and hear how the order of the notes changes the colour of a chord.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1,
  instructions: [
    "Strike each chord once on beat 1 and let it ring for the full two bars.",
    "Up the neck: open G → G barre (E-shape) at the 3rd fret → C-shape with the root at the 10th fret of the A string → A-shape barre at the 10th fret.",
    "Then come back down through the same shapes: C-shape → barre → and loop to the open G.",
    "Use the ringing bar to prepare the next shape so it lands exactly on the next beat 1.",
  ],
  tips: [
    "Find the G notes inside every shape first — they anchor each voicing on the neck.",
    "The C-shape and the A-shape share the root at the 10th fret of the A string — keep that finger as your pivot.",
    "Mute unused strings with the side of your fretting fingers so only the written strings ring.",
    "Once it feels easy, find the same four voicings for C and D major.",
  ],
  metronomeSpeed: { min: 60, max: 160, recommended: 120 },
  relatedSkills: ["chords"],
  tablature: [...openShape, ...barreShape, ...cShape, ...aShape, ...cShape, ...barreShape],
};
