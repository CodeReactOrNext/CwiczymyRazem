
import { precisionBendingExercise } from "feature/exercisePlan/data/exerises/precisionBending/precisionBending";
import { spiderLegatoBasicExercise } from "feature/exercisePlan/data/exerises/spiderLegatoBasic/spiderLegatoBasic";
import { spiderRhythmicProgressionExercise } from "feature/exercisePlan/data/exerises/spiderRhythmicProgression/spiderRhythmicProgression";
import { spiderXExercise } from "feature/exercisePlan/data/exerises/spiderX/spiderX";

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
    spiderRhythmicProgressionExercise,
    precisionBendingExercise
  ],
  userId: "system",
  image: warmUpImage,
}; 