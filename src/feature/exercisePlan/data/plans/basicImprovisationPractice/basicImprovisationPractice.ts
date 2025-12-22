

import { oneChordImprovExercise } from "feature/exercisePlan/data/exerises/oneChordImprov/oneChordImprov";
import { oneStringBackingExercise } from "feature/exercisePlan/data/exerises/oneStringBacking/oneStringBacking";
import { triadImprovisationExercise } from "feature/exercisePlan/data/exerises/triadImprovisation/triadImprovisation";

import type { ExercisePlan } from "../../../types/exercise.types";
import basicImprovisationPracticeImage from "./image.webp";

export const basicImprovisationPractice: ExercisePlan = {
  id: "basic_improvisation_practice",
  title: "Basic Improvisation Development Exercise",
  description: "A set of basic exercises developing improvisation skills",
  difficulty: "easy",
  category: "creativity",
  exercises: [
    oneChordImprovExercise,
    oneStringBackingExercise,
    triadImprovisationExercise],
  userId: "system",
  image: basicImprovisationPracticeImage,
}; 