import { triadBar } from "feature/exercisePlan/data/exerises/aMajorTriads/aMajorTriads";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Top three strings (G-B-e), low → high on the neck.
const secondInversionOpen = triadBar("Dm/A", [
  { string: 3, fret: 2 },
  { string: 2, fret: 3 },
  { string: 1, fret: 1 },
]);
const rootPosition = triadBar("Dm", [
  { string: 3, fret: 7 },
  { string: 2, fret: 6 },
  { string: 1, fret: 5 },
]);
const firstInversion = triadBar("Dm/F", [
  { string: 3, fret: 10 },
  { string: 2, fret: 10 },
  { string: 1, fret: 10 },
]);
const secondInversionOctave = triadBar("Dm/A", [
  { string: 3, fret: 14 },
  { string: 2, fret: 15 },
  { string: 1, fret: 13 },
]);

export const dMinorTriadsExercise: Exercise = {
  id: "d_minor_triads",
  title: "Chords — D Minor Triads",
  description:
    "Climb the D minor triad up the top three strings from the open-Dm shape through every inversion to the 15th fret, then walk back down — one shape per bar, looping.",
  whyItMatters:
    "Dm starts on a different inversion than Am, so the order of shapes up the neck changes. Walking it forces you to recognise each minor triad shape by its notes instead of replaying a memorised pattern.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1,
  instructions: [
    "Play only the G, B and high E strings — mute the rest.",
    "Strike each triad once on beat 1 and let it ring for the whole bar.",
    "Up the neck: Dm/A at the 1st–3rd fret (top of the open Dm chord) → Dm at the 5th–7th → Dm/F at the 10th → Dm/A at the 13th–15th.",
    "Then come back down the same way: Dm/F → Dm → and loop to the open-Dm shape.",
    "Use beat 4 to slide into the next shape so it lands exactly on the next beat 1.",
  ],
  tips: [
    "Follow the G string (2 – 7 – 10 – 14 – 10 – 7) — it guides your hand to each shape.",
    "Say the lowest note of each triad out loud (A, D, F, A) to link the shape to its inversion.",
    "The 10th-fret shape is a single one-finger barre across three strings.",
    "Play the D Triads exercise right after — only the F / F# note moves between the two.",
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
