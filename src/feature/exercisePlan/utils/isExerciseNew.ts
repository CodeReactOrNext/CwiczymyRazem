import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/** How long (in days) an exercise stays flagged as "New" after its addedAt date. */
export const NEW_EXERCISE_WINDOW_DAYS = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns true when the exercise was added within the last
 * NEW_EXERCISE_WINDOW_DAYS (≈2 months). Exercises without an `addedAt` date are
 * treated as not new.
 */
export const isExerciseNew = (
  exercise: Pick<Exercise, "addedAt">,
  now: Date = new Date()
): boolean => {
  if (!exercise.addedAt) return false;
  const added = new Date(exercise.addedAt).getTime();
  if (Number.isNaN(added)) return false;
  const ageDays = (now.getTime() - added) / DAY_MS;
  return ageDays >= 0 && ageDays <= NEW_EXERCISE_WINDOW_DAYS;
};
