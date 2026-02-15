import { expressiveBendPhrasingExercise } from "feature/exercisePlan/data/exerises/expressiveBendPhrasing/expressiveBendPhrasing";
import { vibratoMasteryExercise } from "feature/exercisePlan/data/exerises/vibratoMastery/vibratoMastery";

import type { ExercisePlan } from "../../../types/exercise.types";
import { dynamicCrescendoExercise } from "feature/exercisePlan/data/exerises/dynamicCrescendo/dynamicCrescendo";

export const expressiveLeadPlayingPlan: ExercisePlan = {
  id: "expressive_lead_playing",
  title: "Expressive Lead Playing",
  description: "Master your touch, vibrato, and articulation to add emotion and dynamics to your solos.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    vibratoMasteryExercise,
    expressiveBendPhrasingExercise,
    dynamicCrescendoExercise,
  ],
  userId: "system",
  image: null,
};
