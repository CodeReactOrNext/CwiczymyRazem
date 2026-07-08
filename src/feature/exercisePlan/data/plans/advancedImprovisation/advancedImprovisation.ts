import { chordToneImprovisationExercise } from "feature/exercisePlan/data/exerises/chordToneImprovisation/chordToneImprovisation";
import { improvPromptHard } from "feature/exercisePlan/data/exerises/improvPrompt/improvPromptExercises";
import { triadImprovisationExercise } from "feature/exercisePlan/data/exerises/triadImprovisation/triadImprovisation";

import type { ExercisePlan } from "../../../types/exercise.types";

export const advancedImprovisationPlan: ExercisePlan = {
  id: "advanced_improvisation",
  icon: "sparkles",
  color: "pink",
  title: "Advanced Improvisation",
  description: "Targeted practice for harmonic precision using chord tones and triad-based improvisation.",
  difficulty: "hard",
  category: "theory",
  exercises: [
    chordToneImprovisationExercise,
    triadImprovisationExercise,
    improvPromptHard
  ],
  userId: "system",
  image: null,
};
