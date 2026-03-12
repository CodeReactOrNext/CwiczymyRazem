import { jpStretching } from "feature/exercisePlan/data/exerises/jpStretch/jpStretching";
import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";
import { earTrainingMedium } from "feature/exercisePlan/data/exerises/earTraining/earTrainingExercises";
import { improvPromptMedium } from "feature/exercisePlan/data/exerises/improvPrompt/improvPromptExercises";
import { vibratoMasteryExercise } from "feature/exercisePlan/data/exerises/vibratoMastery/vibratoMastery";
import { rhythmicPocketMasteryExercise } from "feature/exercisePlan/data/exerises/rhythmicPocketMastery/rhythmicPocketMastery";

import type { ExercisePlan } from "../../../types/exercise.types";

export const completeDailyPracticePlan: ExercisePlan = {
  id: "complete_daily_practice",
  title: "Complete Daily Practice (~60 min)",
  description: "A balanced full-session daily routine covering all key areas: warm-up, technique, ear training, rhythm, expression, and creativity. A well-rounded practice that builds every fundamental aspect of guitar playing.",
  difficulty: "medium",
  category: "mixed",
  exercises: [
    jpStretching,
    spiderBasicExercise,
    rhythmicPocketMasteryExercise,
    earTrainingMedium,
    vibratoMasteryExercise,
    improvPromptMedium,
  ],
  userId: "system",
  image: null,
};
