import { triadBar } from "feature/exercisePlan/data/exerises/aMajorTriads/aMajorTriads";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

// Top three strings (G-B-e), low → high on the neck.
const firstInversionOpen = triadBar("Em/G", [
  { string: 3, fret: 0 },
  { string: 2, fret: 0 },
  { string: 1, fret: 0 },
]);
const secondInversion = triadBar("Em/B", [
  { string: 3, fret: 4 },
  { string: 2, fret: 5 },
  { string: 1, fret: 3 },
]);
const rootPosition = triadBar("Em", [
  { string: 3, fret: 9 },
  { string: 2, fret: 8 },
  { string: 1, fret: 7 },
]);
const firstInversionOctave = triadBar("Em/G", [
  { string: 3, fret: 12 },
  { string: 2, fret: 12 },
  { string: 1, fret: 12 },
]);

export const eMinorTriadsExercise: Exercise = {
  id: "e_minor_triads",
  title: "Chords — E Minor Triads",
  description:
    "Climb the E minor triad up the top three strings from the open strings through every inversion to the 12th fret, then walk back down — one shape per bar, looping.",
  whyItMatters:
    "Em starts on three open strings, then every other shape has to be fretted. Walking it breaks the habit of leaning on open strings and makes you find the same three notes in fretted shapes all the way up the neck.",
  difficulty: "beginner",
  category: "theory",
  timeInMinutes: 1,
  instructions: [
    "Play only the G, B and high E strings — mute the rest.",
    "Strike each triad once on beat 1 and let it ring for the whole bar.",
    "Up the neck: Em/G on the open strings → Em/B at the 3rd–5th → Em at the 7th–9th → Em/G at the 12th fret.",
    "Then come back down the same way: Em → Em/B → and loop to the open strings.",
    "Use beat 4 to slide into the next shape so it lands exactly on the next beat 1.",
  ],
  tips: [
    "Follow the G string (0 – 4 – 9 – 12 – 9 – 4) — it guides your hand to each shape.",
    "Say the lowest note of each triad out loud (G, B, E, G) to link the shape to its inversion.",
    "The 12th-fret shape is the open strings an octave higher — a single one-finger barre.",
    "Play the E Triads exercise right after — only the G / G# note moves between the two.",
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
