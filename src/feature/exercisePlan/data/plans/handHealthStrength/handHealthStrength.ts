import { jpStretching } from "feature/exercisePlan/data/exerises/jpStretch/jpStretching";
import { fretStretchDrillExercise } from "feature/exercisePlan/data/exerises/fretStretchDrill/fretStretchDrill";
import { pinkyPowerDrillExercise } from "feature/exercisePlan/data/exerises/pinkyPowerDrill/pinkyPowerDrill";
import { chromaticSpiderWalkExercise } from "feature/exercisePlan/data/exerises/chromaticSpiderWalk/chromaticSpiderWalk";

import type { ExercisePlan } from "../../../types/exercise.types";

export const handHealthStrengthPlan: ExercisePlan = {
  id: "hand_health_strength",
  title: "Hand Health & Strength",
  description: "A routine focused on stretching, finger independence, and strengthening the pinky to ensure long-term playing health.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    jpStretching,
    fretStretchDrillExercise,
    pinkyPowerDrillExercise,
    chromaticSpiderWalkExercise
  ],
  userId: "system",
  image: null,
};
