import { alternatePickingCrossStringExercise } from "feature/exercisePlan/data/exerises/alternatePickingCrossString/alternatePickingCrossString";
import { alternatePickingPentatonicAPositionsExercise } from "feature/exercisePlan/data/exerises/alternatePickingPentatonicAPositions/alternatePickingPentatonicAPositions";
import { economyPickingAngularExercise } from "feature/exercisePlan/data/exerises/economyPickingAngular/economyPickingAngular";
import { metalTremoloPickingExercise } from "feature/exercisePlan/data/exerises/metalTremoloPicking/metalTremoloPicking";
import { speedBurstChromaticBlitzExercise } from "feature/exercisePlan/data/exerises/speedBurstChromaticBlitz/speedBurstChromaticBlitz";

import type { ExercisePlan } from "../../../types/exercise.types";

export const speedBuildingProgressivePlan: ExercisePlan = {
  id: "speed_building_progressive",
  icon: "rocket",
  color: "red",
  title: "Speed Building Progressive",
  description: "A step-by-step speed development program. Builds picking speed and coordination progressively — from basic chromatic patterns through cross-string alternate picking to economy picking efficiency.",
  difficulty: "hard",
  category: "technique",
  exercises: [
    alternatePickingPentatonicAPositionsExercise,
    alternatePickingCrossStringExercise,
    metalTremoloPickingExercise,
    speedBurstChromaticBlitzExercise,
    economyPickingAngularExercise,
  ],
  userId: "system",
  image: null,
};
