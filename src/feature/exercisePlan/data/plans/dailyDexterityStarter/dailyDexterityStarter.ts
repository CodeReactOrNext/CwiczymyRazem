import { chromaticAccentsExercise } from "feature/exercisePlan/data/exerises/chromaticAccents/chromaticAccents";
import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";
import { spiderOneStringExercise } from "feature/exercisePlan/data/exerises/spiderOneString/spiderOneString";
import { stringRepetitionExercise } from "feature/exercisePlan/data/exerises/stringRepetition/stringRepetition";

import type { ExercisePlan } from "../../../types/exercise.types";

export const dailyDexterityStarterPlan: ExercisePlan = {
  id: "daily_dexterity_starter",
  title: "Daily Dexterity Starter",
  description: "Build fundamental coordination between left and right hand without overstraining.",
  difficulty: "easy",
  category: "technique",
  exercises: [
    spiderOneStringExercise,
    stringRepetitionExercise,
    chromaticAccentsExercise,
    spiderBasicExercise
  ],
  userId: "system",
  image: null,
};
