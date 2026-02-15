import { oneStringBackingExercise } from "feature/exercisePlan/data/exerises/oneStringBacking/oneStringBacking";
import { improvPromptEasy } from "feature/exercisePlan/data/exerises/improvPrompt/improvPromptExercises";
import { playByEarExercise } from "feature/exercisePlan/data/exerises/playByEar/playByEar";

import type { ExercisePlan } from "../../../types/exercise.types";

export const soloingExplorerPlan: ExercisePlan = {
  id: "soloing_explorer",
  title: "Soloing Explorer",
  description: "First steps in improvisation and playing by ear in a very accessible, one-string format.",
  difficulty: "easy",
  category: "creativity",
  exercises: [
    oneStringBackingExercise,
    improvPromptEasy,
    playByEarExercise
  ],
  userId: "system",
  image: null,
};
