

import { callAndResponsePhrasingExercise } from "feature/exercisePlan/data/exerises/callAndResponsePhrasing/callAndResponsePhrasing";
import { improvPromptMedium } from "feature/exercisePlan/data/exerises/improvPrompt/improvPromptExercises";
import { oneChordImprovExercise } from "feature/exercisePlan/data/exerises/oneChordImprov/oneChordImprov";
import { oneStringBackingExercise } from "feature/exercisePlan/data/exerises/oneStringBacking/oneStringBacking";

import type { ExercisePlan } from "../../../types/exercise.types";
import basicImprovisationPracticeImage from "./image.webp";

export const basicImprovisationPractice: ExercisePlan = {
  id: "basic_improvisation_practice",
  icon: "compass",
  color: "purple",
  title: "Basic Improvisation Development Exercise",
  description: "A set of basic exercises developing improvisation skills",
  difficulty: "medium",
  category: "creativity",
  exercises: [
    oneChordImprovExercise,
    oneStringBackingExercise,
    callAndResponsePhrasingExercise,
    improvPromptMedium,
  ],
  userId: "system",
  image: basicImprovisationPracticeImage,
}; 