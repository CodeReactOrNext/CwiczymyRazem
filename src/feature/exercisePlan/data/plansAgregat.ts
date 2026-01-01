import { basicImprovisationPractice } from "feature/exercisePlan/data/plans/basicImprovisationPractice/basicImprovisationPractice";
import { metalGuitarExercisesPlan } from "feature/exercisePlan/data/plans/metalGuitarExercises/metalGuitarExercises";
import { musicianFitnessLvl1S1Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S1";
import { musicianFitnessLvl1S2Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S2";
import { musicianFitnessLvl1S3Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S3";
import { musicianFitnessLvl1S4Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S4";
import { musicianFitnessLvl1S5Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S5";
import { musicianFitnessLvl1S6Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S6";
import { musicianFitnessLvl1S7Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S7";
import { musicianFitnessLvl1S8Plan } from "feature/exercisePlan/data/plans/metalGuitarExercises/musicianFitnessLvl1S8";
import { spiderPermutationPlan } from "feature/exercisePlan/data/plans/spiderPermutationPlan/spiderPermutationPlan";
import { warmUp15MinutesPlan } from "feature/exercisePlan/data/plans/warmUp15Minutes/warmUp15Minutes";
import { warmUp30MinutesPlan } from "feature/exercisePlan/data/plans/warmUp30Minutes/warmUp30Minutes";

import type { ExercisePlan } from "../types/exercise.types";

const difficultyOrder: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export const defaultPlans: ExercisePlan[] = [
  spiderPermutationPlan,
  basicImprovisationPractice,
  warmUp15MinutesPlan,
  warmUp30MinutesPlan,
  // metalGuitarExercisesPlan,
  musicianFitnessLvl1S1Plan,
  musicianFitnessLvl1S2Plan,
  musicianFitnessLvl1S3Plan,
  musicianFitnessLvl1S4Plan,
  musicianFitnessLvl1S5Plan,
  musicianFitnessLvl1S6Plan,
  musicianFitnessLvl1S7Plan,
  musicianFitnessLvl1S8Plan,
].sort((a, b) => (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0));







