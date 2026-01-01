import { metalPlayalongExercise } from "feature/exercisePlan/data/exerises/metalPlayalong/metalPlayalong";

import type { ExercisePlan } from "../../../types/exercise.types";

export const metalGuitarExercisesPlan: ExercisePlan = {
  id: "metal_guitar_exercises",
  title: "Metal Guitar Exercises",
  description: "Practice metal guitar techniques with video playalong",
  difficulty: "medium",
  category: "technique",
  exercises: [metalPlayalongExercise],
  userId: "system",
  image: null,
};
