import { alternatePickingPentatonicAPositionsExercise } from "feature/exercisePlan/data/exerises/alternatePickingPentatonicAPositions/alternatePickingPentatonicAPositions";
import { bendAndReleaseExercise } from "feature/exercisePlan/data/exerises/bendAndRelease/bendAndRelease";
import { earTrainingMedium } from "feature/exercisePlan/data/exerises/earTraining/earTrainingExercises";
import { improvPromptMedium } from "feature/exercisePlan/data/exerises/improvPrompt/improvPromptExercises";
import { jpStretching } from "feature/exercisePlan/data/exerises/jpStretch/jpStretching";
import { miniArpeggioExercise } from "feature/exercisePlan/data/exerises/miniArpeggio/miniArpeggio";
import { rhythmicPocketMasteryExercise } from "feature/exercisePlan/data/exerises/rhythmicPocketMastery/rhythmicPocketMastery";
import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";
import { vibratoSustainDrillExercise } from "feature/exercisePlan/data/exerises/vibratoSustainDrill/vibratoSustainDrill";

import type { ExercisePlan } from "../../../types/exercise.types";

export const completeDailyPracticePlan: ExercisePlan = {
  id: "complete_daily_practice",
  title: "Complete Daily Practice",
  description: "A balanced full-session daily routine covering all key areas: warm-up, technique, ear training, rhythm, expression, and creativity. A well-rounded practice that builds every fundamental aspect of guitar playing.",
  difficulty: "medium",
  category: "mixed",
  exercises: [
    jpStretching,
    spiderBasicExercise,
    alternatePickingPentatonicAPositionsExercise,
    miniArpeggioExercise,
    rhythmicPocketMasteryExercise,
    earTrainingMedium,
    vibratoSustainDrillExercise,
    bendAndReleaseExercise,
    improvPromptMedium,
  ],
  userId: "system",
  image: null,
};
