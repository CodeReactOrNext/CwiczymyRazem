import { fingerIndependence1aExercise } from "feature/exercisePlan/data/exerises/fingerIndependence1a/fingerIndependence1a";
import { fretStretchDrillExercise } from "feature/exercisePlan/data/exerises/fretStretchDrill/fretStretchDrill";
import { jpStretching } from "feature/exercisePlan/data/exerises/jpStretch/jpStretching";
import { pinkyPowerDrillExercise } from "feature/exercisePlan/data/exerises/pinkyPowerDrill/pinkyPowerDrill";

import type { ExercisePlan } from "../../../types/exercise.types";

export const handHealthStrengthPlan: ExercisePlan = {
  id: "hand_health_strength",
  title: "Hand Health & Strength",
  description: "A routine focused on stretching, finger independence, and strengthening the pinky to ensure long-term playing health.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    jpStretching,
    fingerIndependence1aExercise,
    pinkyPowerDrillExercise,
    fretStretchDrillExercise,
  ],
  userId: "system",
  image: null,
  icon: "heart",
  color: "rose",
};
