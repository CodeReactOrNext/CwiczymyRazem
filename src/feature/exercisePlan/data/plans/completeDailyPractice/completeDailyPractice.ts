import { alternatePickingPentatonicAPositionsExercise } from "feature/exercisePlan/data/exerises/alternatePickingPentatonicAPositions/alternatePickingPentatonicAPositions";
import { bendAndReleaseExercise } from "feature/exercisePlan/data/exerises/bendAndRelease/bendAndRelease";
import { chromaticAccentsExercise } from "feature/exercisePlan/data/exerises/chromaticAccents/chromaticAccents";
import { earTrainingMedium } from "feature/exercisePlan/data/exerises/earTraining/earTrainingExercises";
import { improvPromptMedium } from "feature/exercisePlan/data/exerises/improvPrompt/improvPromptExercises";
import { jpStretching } from "feature/exercisePlan/data/exerises/jpStretch/jpStretching";
import { miniArpeggioExercise } from "feature/exercisePlan/data/exerises/miniArpeggio/miniArpeggio";
import { rhythmicPocketMasteryExercise } from "feature/exercisePlan/data/exerises/rhythmicPocketMastery/rhythmicPocketMastery";
import { vibratoControlDrillExercise } from "feature/exercisePlan/data/exerises/vibratoControlDrill/vibratoControlDrill";

import type { ExercisePlan } from "../../../types/exercise.types";

export const completeDailyPracticePlan: ExercisePlan = {
  id: "complete_daily_practice",
  icon: "star",
  color: "teal",
  title: "Complete Daily Practice",
  description: "A balanced full-session daily routine covering all key areas: warm-up, technique, ear training, rhythm, expression, and creativity. A well-rounded practice that builds every fundamental aspect of guitar playing.",
  difficulty: "medium",
  category: "mixed",
  exercises: [
    jpStretching,
    chromaticAccentsExercise,
    alternatePickingPentatonicAPositionsExercise,
    miniArpeggioExercise,
    rhythmicPocketMasteryExercise,
    earTrainingMedium,
    vibratoControlDrillExercise,
    bendAndReleaseExercise,
    improvPromptMedium,
  ],
  userId: "system",
  image: null,
};
