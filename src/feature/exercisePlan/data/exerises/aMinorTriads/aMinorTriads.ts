import { triadBar } from "feature/exercisePlan/data/exerises/aMajorTriads/aMajorTriads";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Top three strings (G-B-e), low → high on the neck.
const rootOpen = triadBar("Am", [
  { string: 3, fret: 2 },
  { string: 2, fret: 1 },
  { string: 1, fret: 0 },
]);
const firstInversion = triadBar("Am/C", [
  { string: 3, fret: 5 },
  { string: 2, fret: 5 },
  { string: 1, fret: 5 },
]);
const secondInversion = triadBar("Am/E", [
  { string: 3, fret: 9 },
  { string: 2, fret: 10 },
  { string: 1, fret: 8 },
]);
const rootOctave = triadBar("Am", [
  { string: 3, fret: 14 },
  { string: 2, fret: 13 },
  { string: 1, fret: 12 },
]);

export const aMinorTriadsExercise: Exercise = {
  id: "a_minor_triads",
  title: "Chords — A Minor Triads",
  description:
    "Climb the A minor triad up the top three strings through every inversion to the 14th fret, then walk back down — one shape per bar, looping.",
  whyItMatters:
    "Three-string triads are the building blocks of rhythm parts, fills and chord-tone soloing. Moving one minor chord through all its inversions on the same string set shows you where Am lives across the whole neck instead of just in the open position.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1,
  instructions: [
    "Play only the G, B and high E strings — mute the rest.",
    "Strike each triad once on beat 1 and let it ring for the whole bar.",
    "Up the neck: Am at the 2nd fret → Am/C at the 5th → Am/E at the 8th–10th → Am at the 12th–14th.",
    "Then come back down the same way: Am/E → Am/C → and loop to the open Am.",
    "Use beat 4 to slide into the next shape so it lands exactly on the next beat 1.",
  ],
  tips: [
    "Follow the G string (2 – 5 – 9 – 14 – 9 – 5) — it guides your hand to each shape.",
    "Say the lowest note of each triad out loud (A, C, E, A) to link the shape to its inversion.",
    "The 5th-fret shape is a single one-finger barre across three strings.",
    "Play the A Triads exercise right after — only the C / C# note moves between the two.",
  ],
  metronomeSpeed: { min: 60, max: 160, recommended: 120 },
  relatedSkills: ["chords"],
  tablature: [rootOpen, firstInversion, secondInversion, rootOctave, secondInversion, firstInversion],
};
