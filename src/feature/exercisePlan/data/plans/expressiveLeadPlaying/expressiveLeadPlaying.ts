import { dynamicCrescendoExercise } from "feature/exercisePlan/data/exerises/dynamicCrescendo/dynamicCrescendo";
import { expressiveBendPhrasingExercise } from "feature/exercisePlan/data/exerises/expressiveBendPhrasing/expressiveBendPhrasing";
import { vibratoSustainDrillExercise } from "feature/exercisePlan/data/exerises/vibratoSustainDrill/vibratoSustainDrill";

import type { ExercisePlan } from "../../../types/exercise.types";

export const expressiveLeadPlayingPlan: ExercisePlan = {
  id: "expressive_lead_playing",
  title: "Expressive Lead Playing",
  description: "Master your touch, vibrato, and articulation to add emotion and dynamics to your solos.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    vibratoSustainDrillExercise,
    expressiveBendPhrasingExercise,
    dynamicCrescendoExercise,
  ],
  userId: "system",
  image: null,
};
