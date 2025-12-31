import { basicImprovisationPractice } from "feature/exercisePlan/data/plans/basicImprovisationPractice/basicImprovisationPractice";
import { metalGuitarExercisesPlan } from "feature/exercisePlan/data/plans/metalGuitarExercises/metalGuitarExercises";
import { spiderPermutationPlan } from "feature/exercisePlan/data/plans/spiderPermutationPlan/spiderPermutationPlan";
import { warmUp15MinutesPlan } from "feature/exercisePlan/data/plans/warmUp15Minutes/warmUp15Minutes";
import { warmUp30MinutesPlan } from "feature/exercisePlan/data/plans/warmUp30Minutes/warmUp30Minutes";

import type { ExercisePlan } from "../types/exercise.types";

export const defaultPlans: ExercisePlan[] = [
  spiderPermutationPlan,
  basicImprovisationPractice,
  warmUp15MinutesPlan,
  warmUp30MinutesPlan,
  // metalGuitarExercisesPlan,
];