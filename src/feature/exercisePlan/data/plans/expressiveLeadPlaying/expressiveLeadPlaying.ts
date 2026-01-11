import { vibratoMasteryExercise } from "feature/exercisePlan/data/exerises/vibratoMastery/vibratoMastery";
import { articulationContrastExercise } from "feature/exercisePlan/data/exerises/articulationContrast/articulationContrast";
import { precisionBendingExercise } from "feature/exercisePlan/data/exerises/precisionBending/precisionBending";
import { dynamicControlExercise } from "feature/exercisePlan/data/exerises/dynamicControl/dynamicControl";
import type { ExercisePlan } from "../../../types/exercise.types";

export const expressiveLeadPlayingPlan: ExercisePlan = {
  id: "expressive_lead_playing",
  title: "Expressive Lead Playing",
  description: "Master your touch, vibrato, and articulation to add emotion and dynamics to your solos.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    vibratoMasteryExercise,
    articulationContrastExercise,
    precisionBendingExercise,
    dynamicControlExercise
  ],
  userId: "system",
  image: null,
};
