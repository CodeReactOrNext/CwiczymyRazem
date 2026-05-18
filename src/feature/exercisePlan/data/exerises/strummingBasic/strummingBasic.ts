import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const strummingBasicExercise: Exercise = {
  id: "strumming_basic",
  title: "Basic Down Strumming",
  description: "Execute steady downward strumming strokes on every beat to build fundamental rhythm and timing control.",
  whyItMatters: "This exercise establishes the basic pendulum arm movement necessary for all rhythm guitar playing. Strumming steady downbeats locks your internal timing with the metronome, trains your wrist to remain relaxed, and ensures even string contact across the entire chord shape.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Maintain a relaxed, pendulum-like strumming motion of the wrist and forearm.",
    "Execute even, fluid down and up strokes, keeping pick depth shallow.",
    "Use light fretting-hand pressure releases to mute the strings cleanly on rhythmic rests."
  ],
  tips: [
    "Angle the pick slightly so it glides smoothly across the strings rather than catching.",
    "Focus on the dynamic contrast between accented strums and quiet ghost strokes.",
    "Keep your arm moving continuously, even during silent rests, to internalize the groove."
  ],
  metronomeSpeed: { min: 50, max: 120, recommended: 70 },
  relatedSkills: ["rhythm"],
  strummingPatterns: [
    {
      name: "Pattern: All Downs",
      timeSignature: [4, 4],
      subdivisions: 2,
      strums: [
        { direction: "down" },
        { direction: "miss" },
        { direction: "down" },
        { direction: "miss" },
        { direction: "down" },
        { direction: "miss" },
        { direction: "down" },
        { direction: "miss" },
      ],
    },
  ],
};
