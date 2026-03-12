import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const strummingDownUpExercise: Exercise = {
  id: "strumming_down_up",
  title: "Down-Up Strumming",
  description: "Introduces alternating down-up strumming — the foundation of most rhythm guitar patterns.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 7,
  instructions: [
    "Keep your strumming arm moving in a constant pendulum: DOWN on every beat, UP on every '&' (the 'and' between beats).",
    "Pattern: ↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑ — all 8 strums per bar.",
    "Even when you eventually skip strums, your arm keeps swinging — never stop the motion.",
    "Start with open Em chord at slow tempo until both hands are synchronized.",
    "Gradually introduce chord changes (Em → Am → C → D).",
  ],
  tips: [
    "Down strums use the weight of your arm; up strums are lighter — let that dynamic contrast happen naturally.",
    "Your wrist should be loose. Tension is the enemy of rhythm.",
    "If you're rushing, focus your ears on the metronome click — let it be your anchor.",
  ],
  metronomeSpeed: { min: 50, max: 110, recommended: 65 },
  relatedSkills: ["rhythm"],
  strummingPatterns: [
    {
      name: "Pattern: All 8ths",
      timeSignature: [4, 4],
      subdivisions: 2,
      strums: [
        { direction: "down" },
        { direction: "up" },
        { direction: "down" },
        { direction: "up" },
        { direction: "down" },
        { direction: "up" },
        { direction: "down" },
        { direction: "up" },
      ],
    },
    {
      name: "Variation: Skip beat 3 upstroke",
      timeSignature: [4, 4],
      subdivisions: 2,
      strums: [
        { direction: "down" },
        { direction: "up" },
        { direction: "down" },
        { direction: "up" },
        { direction: "down" },
        { direction: "miss" },
        { direction: "down" },
        { direction: "up" },
      ],
    },
  ],
};
