import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const strummingRockExercise: Exercise = {
  id: "strumming_rock",
  title: "Rock Strumming Patterns",
  description: "Practice dynamic rock strumming patterns featuring heavy accents and steady timing.",
  whyItMatters: "Rock rhythm requires a solid pocket and dynamic contrast between loud and soft strums. Developing a robust library of strumming patterns allows you to back up any song with confidence.",
  difficulty: "beginner",
  category: "technique",
  timeInMinutes: 8,
  instructions: [
    "Execute strums with a loose, relaxed wrist, maintaining a steady tempo.",
    "Vary your strumming force to create a clear contrast between soft and loud beats."
  ],
  tips: [
    "Keep the pendulum motion going even during rests or empty strums.",
    "Accent the downbeats to lock in with the simulated rhythm section."
  ],
  metronomeSpeed: { min: 40, max: 140, recommended: 90 },
  relatedSkills: ["rhythm"],
  strummingPatterns: [
    {
      name: "Pattern A: Classic Rock",
      timeSignature: [4, 4],
      subdivisions: 2,
      strums: [
        { direction: "down", accented: true },
        { direction: "miss" },
        { direction: "down", accented: true },
        { direction: "up" },
        { direction: "miss" },
        { direction: "up" },
        { direction: "down", accented: true },
        { direction: "up" },
      ],
    },
    {
      name: "Pattern B: Chuck Groove",
      timeSignature: [4, 4],
      subdivisions: 2,
      strums: [
        { direction: "down", accented: true },
        { direction: "up" },
        { direction: "down", muted: true },
        { direction: "up" },
        { direction: "down", accented: true },
        { direction: "up" },
        { direction: "down", muted: true },
        { direction: "miss" },
      ],
    },
    {
      name: "Pattern C: Syncopated Push",
      timeSignature: [4, 4],
      subdivisions: 2,
      strums: [
        { direction: "down", accented: true },
        { direction: "miss" },
        { direction: "miss" },
        { direction: "up" },
        { direction: "down", accented: true },
        { direction: "miss" },
        { direction: "miss" },
        { direction: "up" },
      ],
    },
  ],
};
