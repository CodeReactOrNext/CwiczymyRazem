
import { precisionBendingExercise } from "feature/exercisePlan/data/exerises/precisionBending/precisionBending";
import { spiderLegatoBasicExercise } from "feature/exercisePlan/data/exerises/spiderLegatoBasic/spiderLegatoBasic";
import { spiderRhythmicProgressionExercise } from "feature/exercisePlan/data/exerises/spiderRhythmicProgression/spiderRhythmicProgression";
import { spiderXExercise } from "feature/exercisePlan/data/exerises/spiderX/spiderX";

import type { ExercisePlan } from "../../../types/exercise.types";
import warmUpImage from "./image.webp";


export const warmUp30MinutesPlan: ExercisePlan = {
  id: "warm_up_30_minutes",
    title: "Rozgrzewka - 30 minut",
    description: "Podstawowa rozgrzewka na 30 minut przed właściwym treningiem",
  difficulty: "easy",
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