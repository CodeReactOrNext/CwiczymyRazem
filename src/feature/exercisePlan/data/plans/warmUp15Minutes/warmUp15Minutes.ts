
import { jpStretching } from "feature/exercisePlan/data/exerises/jpStretch/jpStretching";
import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";
import { spiderLegatoBasicExercise } from "feature/exercisePlan/data/exerises/spiderLegatoBasic/spiderLegatoBasic";
import { mutingDisciplineDrillExercise } from "feature/exercisePlan/data/exerises/mutingDisciplineDrill/mutingDisciplineDrill";

import type { ExercisePlan } from "../../../types/exercise.types";
import warmUpImage from "./image.webp";

export const warmUp15MinutesPlan: ExercisePlan = {
  id: "warm_up_15_minutes",
  title: "Warm-up - 15 Minutes",
  description: "Basic 15-minute warm-up before your main practice session",
  difficulty: "medium",
  category: "technique",
  exercises: [
    jpStretching,
    spiderBasicExercise,
    spiderLegatoBasicExercise,
    mutingDisciplineDrillExercise
  ],
  userId: "system",
  image: warmUpImage,
}; 