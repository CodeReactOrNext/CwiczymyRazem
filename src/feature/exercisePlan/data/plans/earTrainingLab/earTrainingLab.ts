import {
  earChordQualityBasicsExercise,
  earModeBasicsExercise,
  earProgressionBasicsExercise,
  earTuningTrainerExercise,
} from "feature/exercisePlan/data/exerises/earQuiz/earQuizExercises";

import type { ExercisePlan } from "../../../types/exercise.types";

export const earTrainingLabPlan: ExercisePlan = {
  id: "ear_training_lab",
  title: "Ear Training Lab",
  description:
    "One session through all four listening drills: chord quality, progressions, tuning by ear and modes. No guitar needed — just headphones.",
  difficulty: "medium",
  category: "hearing",
  exercises: [
    earChordQualityBasicsExercise,
    earProgressionBasicsExercise,
    earTuningTrainerExercise,
    earModeBasicsExercise,
  ],
  userId: "system",
  image: null,
  icon: "headphones",
  color: "cyan",
};
