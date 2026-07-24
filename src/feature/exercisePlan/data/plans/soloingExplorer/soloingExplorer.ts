import { improvPromptEasy } from "feature/exercisePlan/data/exerises/improvPrompt/improvPromptExercises";
import { oneStringBackingExercise } from "feature/exercisePlan/data/exerises/oneStringBacking/oneStringBacking";
import { twoNotesPerBarPhrasingExercise } from "feature/exercisePlan/data/exerises/twoNotesPerBarPhrasing/twoNotesPerBarPhrasing";

import type { ExercisePlan } from "../../../types/exercise.types";

export const soloingExplorerPlan: ExercisePlan = {
  id: "soloing_explorer",
  icon: "compass",
  color: "indigo",
  title: "Soloing Explorer",
  description: "First steps in improvisation, phrasing, and playing by ear in a very accessible format.",
  difficulty: "easy",
  category: "creativity",
  exercises: [
    oneStringBackingExercise,
    improvPromptEasy,
    twoNotesPerBarPhrasingExercise
  ],
  userId: "system",
  image: null,
};
