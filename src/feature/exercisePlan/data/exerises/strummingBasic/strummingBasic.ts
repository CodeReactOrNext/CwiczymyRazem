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
    "Hold a basic chord of your choice (such as Em or G major) and strum down cleanly on every beat.",
    "Keep your strumming elbow relaxed and allow the forearm to move like a steady pendulum.",
    "Ensure every string rings out cleanly with consistent volume across each strum.",
  ],
  tips: [
    "Maintain the continuous pendulum swing of your arm, even on silent or missed beats.",
    "Use a light grip on the pick to prevent harsh contact with the strings.",
    "Focus on perfect rhythmic alignment with the metronome click.",
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
