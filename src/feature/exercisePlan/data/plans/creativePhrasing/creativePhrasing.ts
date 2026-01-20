import { callAndResponsePhrasingExercise } from "feature/exercisePlan/data/exerises/callAndResponsePhrasing/callAndResponsePhrasing";
import { oneChordImprovExercise } from "feature/exercisePlan/data/exerises/oneChordImprov/oneChordImprov";
import { twoNotesPerBarPhrasingExercise } from "feature/exercisePlan/data/exerises/twoNotesPerBarPhrasing/twoNotesPerBarPhrasing";

import type { ExercisePlan } from "../../../types/exercise.types";

export const creativePhrasingPlan: ExercisePlan = {
  id: "creative_phrasing",
  title: "Creative Phrasing",
  description: "Improve space, rhythmic placement, and musical dialogue in your solos.",
  difficulty: "medium",
  category: "creativity",
  exercises: [
    twoNotesPerBarPhrasingExercise,
    callAndResponsePhrasingExercise,
    oneChordImprovExercise
  ],
  userId: "system",
  image: null,
};
