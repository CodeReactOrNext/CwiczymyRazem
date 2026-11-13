import { earTrainingEasy } from "feature/exercisePlan/data/exerises/earTraining/earTrainingExercises";
import { rhythmTrainingEasy } from "feature/exercisePlan/data/exerises/rhythmTraining/rhythmTraining";
import { transcriptionMelodyExercise } from "feature/exercisePlan/data/exerises/transcription/transcription";
import { tripletsDrillExercise } from "feature/exercisePlan/data/exerises/tripletsDrill/tripletsDrill";

import type { ExercisePlan } from "../../../types/exercise.types";

export const earRhythmFundamentalsPlan: ExercisePlan = {
  id: "ear_rhythm_fundamentals",
  title: "Ear & Rhythm Fundamentals",
  description: "Build a solid foundation of musicality by training your ears and sense of rhythm simultaneously.",
  difficulty: "easy",
  category: "theory",
  exercises: [
    earTrainingEasy,
    rhythmTrainingEasy,
    tripletsDrillExercise,
    transcriptionMelodyExercise,
  ],
  userId: "system",
  image: null,
  icon: "headphones",
  color: "teal",
};
