import { alternatePickingCrossStringExercise } from "feature/exercisePlan/data/exerises/alternatePickingCrossString/alternatePickingCrossString";
import { chromaticSpiderWalkExercise } from "feature/exercisePlan/data/exerises/chromaticSpiderWalk/chromaticSpiderWalk";
import { economyPickingAngularExercise } from "feature/exercisePlan/data/exerises/economyPickingAngular/economyPickingAngular";
import { speedBurstChromaticBlitzExercise } from "feature/exercisePlan/data/exerises/speedBurstChromaticBlitz/speedBurstChromaticBlitz";
import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";

import type { ExercisePlan } from "../../../types/exercise.types";

export const speedBuildingProgressivePlan: ExercisePlan = {
  id: "speed_building_progressive",
  title: "Speed Building Progressive",
  description: "A step-by-step speed development program. Builds picking speed and coordination progressively — from basic chromatic patterns through cross-string alternate picking to economy picking efficiency.",
  difficulty: "hard",
  category: "technique",
  exercises: [
    spiderBasicExercise,
    chromaticSpiderWalkExercise,
    alternatePickingCrossStringExercise,
    speedBurstChromaticBlitzExercise,
    economyPickingAngularExercise,
  ],
  userId: "system",
  image: null,
};
