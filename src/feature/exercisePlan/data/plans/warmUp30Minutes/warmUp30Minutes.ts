
import { spiderLegatoBasicExercise } from "feature/exercisePlan/data/exerises/spiderLegatoBasic/spiderLegatoBasic";
import { spiderXExercise } from "feature/exercisePlan/data/exerises/spiderX/spiderX";
import { mutingDisciplineDrillExercise } from "feature/exercisePlan/data/exerises/mutingDisciplineDrill/mutingDisciplineDrill";

import type { ExercisePlan } from "../../../types/exercise.types";
import warmUpImage from "./image.webp";


export const warmUp30MinutesPlan: ExercisePlan = {
  id: "warm_up_30_minutes",
  title: "Warm-up - 30 Minutes",
  description: "Basic 30-minute warm-up before your main practice session",
  difficulty: "medium",
  category: "technique",
  exercises: [
    spiderXExercise,
    spiderLegatoBasicExercise,
    mutingDisciplineDrillExercise
  ],
  userId: "system",
  image: warmUpImage,
}; 