import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const strummingBasicExercise: Exercise = {
  id: "strumming_basic",
  title: "Basic Down Strumming",
  description: "Foundation of rhythm guitar — steady down strums on every beat.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Hold a chord of your choice (Em or G are great for beginners).",
    "Strum downward on every beat: 1, 2, 3, 4.",
    "Keep your strumming arm moving at a steady pendulum motion — don't tense up.",
    "Focus on hitting all strings cleanly with consistent volume.",
    "Once comfortable, try switching chords every 2 beats without stopping.",
  ],
  tips: [
    "Think of your arm as a pendulum — it should always keep swinging even when you skip a strum.",
    "Start very slow (60 BPM) and only speed up when the pattern feels automatic.",
    "Listen for even spacing between strums — use the metronome as a guide.",
  ],
  metronomeSpeed: { min: 50, max: 120, recommended: 70 },
  relatedSkills: ["chords", "rhythm"],
  strummingPatterns: [
    {
      name: "Pattern: All Downs",
      timeSignature: [4, 4],
      subdivisions: 2,
      chord: "Em",
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
