import { metronomeGapTestExercise } from "feature/exercisePlan/data/exerises/metronomeGapTest/metronomeGapTest";
import { rhythmicPocketMasteryExercise } from "feature/exercisePlan/data/exerises/rhythmicPocketMastery/rhythmicPocketMastery";
import {
  rhythmTrainingEasy,
  rhythmTrainingHard,
  rhythmTrainingMedium,
} from "feature/exercisePlan/data/exerises/rhythmTraining/rhythmTraining";

import type { ExercisePlan } from "../../../types/exercise.types";

export const rhythmTimingPlan: ExercisePlan = {
  id: "rhythm_timing_foundations",
  title: "Rhythm & Timing",
  description:
    "Develop a rock-solid internal clock — start with quarter-note pulses, progress through eighth- and sixteenth-note subdivisions, master subdivision switching, and test your timing through silence.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    rhythmTrainingEasy,
    rhythmTrainingMedium,
    rhythmicPocketMasteryExercise,
    metronomeGapTestExercise,
    rhythmTrainingHard,
  ],
  userId: "system",
  image: null,
  icon: "drum",
  color: "purple",
};
