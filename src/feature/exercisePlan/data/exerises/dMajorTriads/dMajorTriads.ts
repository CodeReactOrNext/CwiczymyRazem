import { triadBar } from "feature/exercisePlan/data/exerises/aMajorTriads/aMajorTriads";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Top three strings (G-B-e), low → high on the neck.
const secondInversionOpen = triadBar("D/A", [
  { string: 3, fret: 2 },
  { string: 2, fret: 3 },
  { string: 1, fret: 2 },
]);
const rootPosition = triadBar("D", [
  { string: 3, fret: 7 },
  { string: 2, fret: 7 },
  { string: 1, fret: 5 },
]);
const firstInversion = triadBar("D/F#", [
  { string: 3, fret: 11 },
  { string: 2, fret: 10 },
  { string: 1, fret: 10 },
]);
const secondInversionOctave = triadBar("D/A", [
  { string: 3, fret: 14 },
  { string: 2, fret: 15 },
  { string: 1, fret: 14 },
]);

export const dMajorTriadsExercise: Exercise = {
  id: "d_major_triads",
  title: "Chords — D Triads",
  description:
    "Climb the D major triad up the top three strings from the open-D shape through every inversion to the 15th fret, then walk back down — one shape per bar, looping.",
  whyItMatters:
    "D starts on a different inversion than A, so the order of shapes up the neck changes. Walking it forces you to recognise each triad shape by its notes instead of replaying a memorised pattern.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1,
  instructions: [
    "Play only the G, B and high E strings — mute the rest.",
    "Strike each triad once on beat 1 and let it ring for the whole bar.",
    "Up the neck: D/A at the 2nd–3rd fret (top of the open D chord) → D at the 5th–7th → D/F# at the 10th–11th → D/A at the 14th–15th.",
    "Then come back down the same way: D/F# → D → and loop to the open-D shape.",
    "Use beat 4 to slide into the next shape so it lands exactly on the next beat 1.",
  ],
  tips: [
    "Follow the G string (2 – 7 – 11 – 14 – 11 – 7) — it guides your hand to each shape.",
    "Say the lowest note of each triad out loud (A, D, F#, A) to link the shape to its inversion.",
    "Compare with A Triads: the shapes are the same, but here they come in a different order.",
  ],
  metronomeSpeed: { min: 60, max: 160, recommended: 120 },
  relatedSkills: ["chords"],
  tablature: [
    secondInversionOpen,
    rootPosition,
    firstInversion,
    secondInversionOctave,
    firstInversion,
    rootPosition,
  ],
};
