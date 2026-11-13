import { callAndResponsePhrasingExercise } from "feature/exercisePlan/data/exerises/callAndResponsePhrasing/callAndResponsePhrasing";
import { expressiveBendPhrasingExercise } from "feature/exercisePlan/data/exerises/expressiveBendPhrasing/expressiveBendPhrasing";
import { twoNotesPerBarPhrasingExercise } from "feature/exercisePlan/data/exerises/twoNotesPerBarPhrasing/twoNotesPerBarPhrasing";

import type { ExercisePlan } from "../../../types/exercise.types";

export const creativePhrasingPlan: ExercisePlan = {
  id: "creative_phrasing",
  icon: "music2",
  color: "rose",
  title: "Creative Phrasing",
  description: "Improve space, rhythmic placement, and musical dialogue in your solos.",
  difficulty: "medium",
  category: "creativity",
  exercises: [
    twoNotesPerBarPhrasingExercise,
    callAndResponsePhrasingExercise,
    expressiveBendPhrasingExercise,
  ],
  userId: "system",
  image: null,
};
