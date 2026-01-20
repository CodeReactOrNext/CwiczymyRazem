import { chordToneImprovisationExercise } from "feature/exercisePlan/data/exerises/chordToneImprovisation/chordToneImprovisation";
import { triadImprovisationExercise } from "feature/exercisePlan/data/exerises/triadImprovisation/triadImprovisation";

import type { ExercisePlan } from "../../../types/exercise.types";

export const advancedImprovisationPlan: ExercisePlan = {
  id: "advanced_improvisation",
  title: "Advanced Improvisation",
  description: "Targeted practice for harmonic precision using chord tones and triad-based improvisation.",
  difficulty: "hard",
  category: "theory",
  exercises: [
    chordToneImprovisationExercise,
    triadImprovisationExercise
  ],
  userId: "system",
  image: null,
};
