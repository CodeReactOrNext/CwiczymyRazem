import { funkSixteenthScratchExercise } from "feature/exercisePlan/data/exerises/funkSixteenthScratch/funkSixteenthScratch";
import { meterSwitch68To34Exercise } from "feature/exercisePlan/data/exerises/meterSwitching/meterSwitch68To34";
import { metronomeGapTestExercise } from "feature/exercisePlan/data/exerises/metronomeGapTest/metronomeGapTest";
import { rhythmicPocketMasteryExercise } from "feature/exercisePlan/data/exerises/rhythmicPocketMastery/rhythmicPocketMastery";
import { rhythmTrainingEasy } from "feature/exercisePlan/data/exerises/rhythmTraining/rhythmTraining";

import type { ExercisePlan } from "../../../types/exercise.types";

export const rhythmTimingPlan: ExercisePlan = {
  id: "rhythm_timing_foundations",
  title: "Rhythm & Timing",
  description:
    "Develop a rock-solid internal clock — start with a steady pulse, lock in a sixteenth-note funk scratch, master subdivision switching, test your timing through silence, and finish with a 6/8 ↔ 3/4 hemiola.",
  difficulty: "medium",
  category: "technique",
  exercises: [
    rhythmTrainingEasy,
    funkSixteenthScratchExercise,
    rhythmicPocketMasteryExercise,
    metronomeGapTestExercise,
    meterSwitch68To34Exercise,
  ],
  userId: "system",
  image: null,
  icon: "drum",
  color: "purple",
};
