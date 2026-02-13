import { chromaticAccentsExercise } from "feature/exercisePlan/data/exerises/chromaticAccents/chromaticAccents";
import { metronomeGapTestExercise } from "feature/exercisePlan/data/exerises/metronomeGapTest/metronomeGapTest";

import type { ExercisePlan } from "../../../types/exercise.types";

export const rhythmicPrecisionPlan: ExercisePlan = {
  id: "rhythmic_precision",
  title: "Rhythmic Precision & Timing",
  description: "Develop rock-solid timing and the ability to play complex rhythms with or without a metronome.",
  difficulty: "hard",
  category: "theory",
  exercises: [
    metronomeGapTestExercise,
    chromaticAccentsExercise
  ],
  userId: "system",
  image: null,
};
