import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import { spiderOneStringExercise } from "./exerises/spiderOneString/spiderOneString";
import { spiderStairsExercise } from "./exerises/spiderStairs/spiderStairs";
import { spiderStairsHardExercise } from "./exerises/spiderStairsHard/spiderStairsHard";
import { SpiderStringSkippingExercise } from "./exerises/spiderStringSkipping/spiderStringSkipping";
import { spiderXExercise } from "./exerises/spiderX/spiderX";
import { spiderXExtendedExercise } from "./exerises/spiderXExtended/spiderXExtended";


export const exercisesAgregat: Exercise[] = [
  spiderOneStringExercise,
  spiderStairsExercise,
  spiderStairsHardExercise,
  SpiderStringSkippingExercise,
  spiderXExercise,
  spiderXExtendedExercise,
  spiderBasicExercise,
];
