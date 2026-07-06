import { strummingBasicExercise } from "feature/exercisePlan/data/exerises/strummingBasic/strummingBasic";
import { strummingDownUpExercise } from "feature/exercisePlan/data/exerises/strummingDownUp/strummingDownUp";
import {
  strummingPattern4,
  strummingPattern8,
} from "feature/exercisePlan/data/exerises/strummingPatterns/strummingPatterns";
import { strummingRockExercise } from "feature/exercisePlan/data/exerises/strummingRock/strummingRock";

import type { ExercisePlan } from "../../../types/exercise.types";

export const strummingFoundationsPlan: ExercisePlan = {
  id: "strumming_foundations",
  title: "Strumming Foundations",
  description:
    "Build a confident strumming hand from the ground up — steady downstrokes, a fluid down-up pendulum, essential patterns, and your first rock groove.",
  difficulty: "beginner",
  category: "technique",
  exercises: [
    strummingBasicExercise,
    strummingDownUpExercise,
    strummingPattern4,
    strummingPattern8,
    strummingRockExercise,
  ],
  userId: "system",
  image: null,
  icon: "audio",
  color: "orange",
};
