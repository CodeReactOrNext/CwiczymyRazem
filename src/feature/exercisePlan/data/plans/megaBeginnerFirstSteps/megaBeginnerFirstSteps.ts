import { openGRepetitionExercise } from "feature/exercisePlan/data/exerises/openGRepetition/openGRepetition";
import { stringRepetitionExercise } from "feature/exercisePlan/data/exerises/stringRepetition/stringRepetition";
import { spiderChromaticsExercise } from "feature/exercisePlan/data/exerises/spiderChromatics/spiderChromatics";

import type { ExercisePlan } from "../../../types/exercise.types";

export const megaBeginnerFirstStepsPlan: ExercisePlan = {
  id: "mega_beginner_first_steps",
  title: "Mega Beginner: First Steps",
  description: "Perfect starting point for someone who just picked up the guitar. Focuses on basic string awareness and coordination.",
  difficulty: "easy",
  category: "technique",
  exercises: [
    openGRepetitionExercise,
    stringRepetitionExercise,
    spiderChromaticsExercise
  ],
  userId: "system",
  image: null, // Image will be added once approved or handled
};
