import { spiderBasicExercise } from "../../exerises/spiderBasic/spiderBasic";
import { spiderStairsExercise } from "../../exerises/spiderStairs/spiderStairs";
import { spiderStairsHardExercise } from "../../exerises/spiderStairsHard/spiderStairsHard";
import { SpiderStringSkippingExercise } from "../../exerises/spiderStringSkipping/spiderStringSkipping";
import { spiderXExercise } from "../../exerises/spiderX/spiderX";
import { spiderXExtendedExercise } from "../../exerises/spiderXExtended/spiderXExtended";
import { spiderRhythmicProgressionExercise } from "../../exerises/spiderRhythmicProgression/spiderRhythmicProgression";
import { legatoSextuplets457Exercise } from "../../exerises/legatoSextuplets457/legatoSextuplets457";
import { spiderPermutation1234Exercise } from "../../exerises/spiderPermutation1234/spiderPermutation1234";

import type { ExercisePlan } from "../../../types/exercise.types";
import spiderImage from "../spiderPermutationPlan/image.webp";

export const spiderMasterPlan: ExercisePlan = {
  id: "spider_master_plan",
  title: "Master Spider Training",
  description: "The ultimate chromatic technical development program. Covers basic permutations, stairs, skips, X-patterns, and rhythmic variations.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    spiderBasicExercise,
    spiderPermutation1234Exercise,
    spiderStairsExercise,
    spiderStairsHardExercise,
    SpiderStringSkippingExercise,
    spiderXExercise,
    spiderXExtendedExercise,
    spiderRhythmicProgressionExercise,
    legatoSextuplets457Exercise,
  ],
  userId: "system",
  image: spiderImage,
};
