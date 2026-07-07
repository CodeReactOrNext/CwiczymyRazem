import { chromaticAccentsExercise } from "feature/exercisePlan/data/exerises/chromaticAccents/chromaticAccents";
import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";
import { spiderChromaticsExercise } from "feature/exercisePlan/data/exerises/spiderChromatics/spiderChromatics";
import { spiderOneStringExercise } from "feature/exercisePlan/data/exerises/spiderOneString/spiderOneString";
import { stringRepetitionExercise } from "feature/exercisePlan/data/exerises/stringRepetition/stringRepetition";

import type { ExercisePlan } from "../../../types/exercise.types";

export const dailyDexterityStarterPlan: ExercisePlan = {
  id: "daily_dexterity_starter",
  icon: "hand",
  color: "cyan",
  title: "Daily Dexterity Starter",
  description: "Build fundamental coordination between left and right hand without overstraining.",
  difficulty: "easy",
  category: "technique",
  exercises: [
    spiderOneStringExercise,
    stringRepetitionExercise,
    chromaticAccentsExercise,
    spiderBasicExercise,
    spiderChromaticsExercise
  ],
  userId: "system",
  image: null,
};
