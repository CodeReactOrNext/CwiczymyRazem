import { precisionBendingExercise } from "feature/exercisePlan/data/exerises/precisionBending/precisionBending";
import { vibratoMasteryExercise } from "feature/exercisePlan/data/exerises/vibratoMastery/vibratoMastery";

import type { ExercisePlan } from "../../../types/exercise.types";

export const expressiveLeadPlayingPlan: ExercisePlan = {
  id: "expressive_lead_playing",
  title: "Expressive Lead Playing",
  description: "Master your touch, vibrato, and articulation to add emotion and dynamics to your solos.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    vibratoMasteryExercise,
    precisionBendingExercise,
  ],
  userId: "system",
  image: null,
};
