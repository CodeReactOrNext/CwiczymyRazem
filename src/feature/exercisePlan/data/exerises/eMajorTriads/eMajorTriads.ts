import { triadBar } from "feature/exercisePlan/data/exerises/aMajorTriads/aMajorTriads";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Top three strings (G-B-e), low → high on the neck.
const firstInversionOpen = triadBar("E/G#", [
  { string: 3, fret: 1 },
  { string: 2, fret: 0 },
  { string: 1, fret: 0 },
]);
const secondInversion = triadBar("E/B", [
  { string: 3, fret: 4 },
  { string: 2, fret: 5 },
  { string: 1, fret: 4 },
]);
const rootPosition = triadBar("E", [
  { string: 3, fret: 9 },
  { string: 2, fret: 9 },
  { string: 1, fret: 7 },
]);
const firstInversionOctave = triadBar("E/G#", [
  { string: 3, fret: 13 },
  { string: 2, fret: 12 },
  { string: 1, fret: 12 },
]);

export const eMajorTriadsExercise: Exercise = {
  id: "e_major_triads",
  title: "Chords — E Triads",
  description:
    "Climb the E major triad up the top three strings from the open strings through every inversion to the 13th fret, then walk back down — one shape per bar, looping.",
  whyItMatters:
    "E starts on the open B and E strings, then every other shape has to be fretted. Walking it breaks the habit of leaning on open strings and makes you find the same three notes in fretted shapes all the way up the neck.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1,
  instructions: [
    "Play only the G, B and high E strings — mute the rest.",
    "Strike each triad once on beat 1 and let it ring for the whole bar.",
    "Up the neck: E/G# with open B and E strings → E/B at the 4th–5th → E at the 7th–9th → E/G# at the 12th–13th.",
    "Then come back down the same way: E → E/B → and loop to the open-string shape.",
    "Use beat 4 to slide into the next shape so it lands exactly on the next beat 1.",
  ],
  tips: [
    "Follow the G string (1 – 4 – 9 – 13 – 9 – 4) — it guides your hand to each shape.",
    "Say the lowest note of each triad out loud (G#, B, E, G#) to link the shape to its inversion.",
    "The 12th–13th fret shape is the open-string one an octave higher — the 12th fret replaces the open strings.",
  ],
  metronomeSpeed: { min: 60, max: 160, recommended: 120 },
  relatedSkills: ["chords"],
  tablature: [
    firstInversionOpen,
    secondInversion,
    rootPosition,
    firstInversionOctave,
    rootPosition,
    secondInversion,
  ],
};
