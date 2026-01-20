import { intervalStringJumpsExercise } from "feature/exercisePlan/data/exerises/intervalStringJumps/intervalStringJumps";
import { playByEarExercise } from "feature/exercisePlan/data/exerises/playByEar/playByEar";
import { singWhatYouPlayExercise } from "feature/exercisePlan/data/exerises/singWhatYouPlay/singWhatYouPlay";

import type { ExercisePlan } from "../../../types/exercise.types";

export const theIntervalMapPlan: ExercisePlan = {
  id: "the_interval_map",
  title: "The Interval Map",
  description: "Bridge the gap between your ears and the fretboard by mastering intervals and melodic dictation.",
  difficulty: "hard",
  category: "hearing",
  exercises: [
    intervalStringJumpsExercise,
    singWhatYouPlayExercise,
    playByEarExercise
  ],
  userId: "system",
  image: null,
};
