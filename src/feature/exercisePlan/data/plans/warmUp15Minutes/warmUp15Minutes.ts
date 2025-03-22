
import { jpStretching } from "feature/exercisePlan/data/exerises/jpStretch/jpStretching";
import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";
import { spiderLegatoBasicExercise } from "feature/exercisePlan/data/exerises/spiderLegatoBasic/spiderLegatoBasic";

import type { ExercisePlan } from "../../../types/exercise.types";
import warmUpImage from "./image.webp";

export const warmUp15MinutesPlan: ExercisePlan = {
  id: "warm_up_15_minutes",
    title: "Rozgrzewka - 15 minut",
    description: "Podstawowa rozgrzewka na 15 minut przed właściwym treningiem",
  difficulty: "easy",
  category: "technique",
  exercises: [
    jpStretching,
    spiderBasicExercise,
    spiderLegatoBasicExercise
  ],
  userId: "system",
  image: warmUpImage,
}; 