import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const vibratoHighPositionExercise: Exercise = {
  id: "vibrato_high_position",
  title: "Vibrato — High Position (Frets 12–17)",
  description:
    "Adapt your vibrato technique to the narrow frets of the upper register.",
  whyItMatters: "The mechanical leverage of the fingers is lower in the high register. Practicing vibrato above the 12th fret trains you to use precise wrist rotation and forearm push/pull to achieve even, expressive pitch modulation.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 6,
  instructions: [
    "Execute tight, controlled wavelike oscillations, adjusting for the narrow fret spacing.",
    "Use precise wrist rotation, keeping your finger tip centered in the fret."
  ],
  tips: [
    "Lower your thumb position slightly to allow for better hand rotation.",
    "Keep your knuckles curved to prevent the string from slipping."
  ],
  metronomeSpeed: { min: 40, max: 80, recommended: 55 },
  relatedSkills: ["vibrato", "articulation"],
  tablature: [
    // M1: E — str1, fret 12 — harmonic position, very responsive
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 1, fret: 12, isVibrato: true }] },
      ],
    },
    // M2: B — str2, fret 17 — tiny fret spacing, minimal motion needed
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 2, fret: 17, isVibrato: true }] },
      ],
    },
    // M3: G — str3, fret 12 — match width from M1 on heavier string
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 3, fret: 12, isVibrato: true }] },
      ],
    },
    // M4: D — str4, fret 14 — heavier string, more wrist force
    {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 4, fret: 14, isVibrato: true }] },
      ],
    },
  ],
};
