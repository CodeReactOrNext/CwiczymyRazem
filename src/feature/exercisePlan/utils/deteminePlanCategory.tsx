import type { Exercise, ExerciseCategory } from "../types/exercise.types";

export const determinePlanCategory = (
  selectedExercises: Exercise[]
): ExerciseCategory => {
  const categories = new Set(
    selectedExercises.map((exercise) => exercise.category)
  );
  if (categories.size === 1) {
    return selectedExercises[0].category;
  }

  return "mixed";
};
