import { earTrainingEasy } from "feature/exercisePlan/data/exerises/earTraining/earTrainingExercises";
import { rhythmTrainingEasy } from "feature/exercisePlan/data/exerises/rhythmTraining/rhythmTraining";
import { metronomeGapTestExercise } from "feature/exercisePlan/data/exerises/metronomeGapTest/metronomeGapTest";
import { singWhatYouPlayExercise } from "feature/exercisePlan/data/exerises/singWhatYouPlay/singWhatYouPlay";

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
    metronomeGapTestExercise,
    singWhatYouPlayExercise
  ],
  userId: "system",
  image: null,
};
