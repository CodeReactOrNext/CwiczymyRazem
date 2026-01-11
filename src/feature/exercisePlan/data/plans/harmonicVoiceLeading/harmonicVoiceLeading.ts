import { guideToneVoiceLeadingExercise } from "feature/exercisePlan/data/exerises/guideToneVoiceLeading/guideToneVoiceLeading";
import { smoothChordTransitionsExercise } from "feature/exercisePlan/data/exerises/smoothChordTransitions/smoothChordTransitions";
import { minimalMotionVoiceLeadingExercise } from "feature/exercisePlan/data/exerises/minimalMotionVoiceLeading/minimalMotionVoiceLeading";
import type { ExercisePlan } from "../../../types/exercise.types";

export const harmonicVoiceLeadingPlan: ExercisePlan = {
  id: "harmonic_voice_leading",
  title: "Harmonic Voice Leading",
  description: "Advanced drill focusing on guide tones, smooth chord transitions, and minimal melodic movement.",
  difficulty: "hard",
  category: "theory",
  exercises: [
    guideToneVoiceLeadingExercise,
    smoothChordTransitionsExercise,
    minimalMotionVoiceLeadingExercise
  ],
  userId: "system",
  image: null,
};
