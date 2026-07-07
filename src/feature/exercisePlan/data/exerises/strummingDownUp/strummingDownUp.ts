import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const strummingDownUpExercise: Exercise = {
  id: "strumming_down_up",
  title: "Down-Up Strumming",
  description: "Develop a fluid, continuous down-up strumming motion with strict rhythm control.",
  whyItMatters: "Continuous down-up motion is the engine of all rhythm playing. Keeping your strumming hand moving like a pendulum ensures perfect timing and lets you accent beats effortlessly.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 3.5,
  instructions: [
    "Keep your strumming arm moving in a steady, pendulum-like motion.",
    "Strum across all target strings with equal pick depth."
  ],
  tips: [
    "Relax your wrist completely; a stiff wrist ruins the fluid strumming motion.",
    "Hold the pick lightly to prevent it from catching on the strings."
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
