import type {
  Exercise,
  TablatureMeasure,
  TablatureNote,
} from "feature/exercisePlan/types/exercise.types";

// One triad per bar, struck on beat 1 and held as a whole note.
export const triadBar = (chordName: string, notes: TablatureNote[]): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: [{ duration: 4, chordName, notes: notes.map((note) => ({ ...note, isLetRing: true })) }],
});

// Top three strings (G-B-e), low → high on the neck.
const rootOpen = triadBar("A", [
  { string: 3, fret: 2 },
  { string: 2, fret: 2 },
  { string: 1, fret: 0 },
]);
const firstInversion = triadBar("A/C#", [
  { string: 3, fret: 6 },
  { string: 2, fret: 5 },
  { string: 1, fret: 5 },
]);
const secondInversion = triadBar("A/E", [
  { string: 3, fret: 9 },
  { string: 2, fret: 10 },
  { string: 1, fret: 9 },
]);
const rootOctave = triadBar("A", [
  { string: 3, fret: 14 },
  { string: 2, fret: 14 },
  { string: 1, fret: 12 },
]);

export const aMajorTriadsExercise: Exercise = {
  id: "a_major_triads",
  title: "Chords — A Triads",
  description:
    "Climb the A major triad up the top three strings through every inversion to the 14th fret, then walk back down — one shape per bar, looping.",
  whyItMatters:
    "Three-string triads are the building blocks of rhythm parts, fills and chord-tone soloing. Moving one chord through all its inversions on the same string set shows you where A lives across the whole neck instead of just in the open position.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1,
  instructions: [
    "Play only the G, B and high E strings — mute the rest.",
    "Strike each triad once on beat 1 and let it ring for the whole bar.",
    "Up the neck: A at the 2nd fret → A/C# at the 5th → A/E at the 9th → A at the 12th–14th.",
    "Then come back down the same way: A/E → A/C# → and loop to the open A.",
    "Use beat 4 to slide into the next shape so it lands exactly on the next beat 1.",
  ],
  tips: [
    "Follow the G string (2 – 6 – 9 – 14 – 9 – 6) — it guides your hand to each shape.",
    "Say the lowest note of each triad out loud (A, C#, E, A) to link the shape to its inversion.",
    "Notice that the 12th–14th fret shape is the open-position one an octave higher.",
    "Once it feels easy, play the same walk with A minor triads by lowering C# to C.",
  ],
  metronomeSpeed: { min: 60, max: 160, recommended: 120 },
  relatedSkills: ["chords"],
  tablature: [rootOpen, firstInversion, secondInversion, rootOctave, secondInversion, firstInversion],
};
