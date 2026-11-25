import type { Exercise } from "../../../types/exercise.types";

/**
 * How full an exercise's part of the session bar is, 0–100, from the time put
 * into it. An exercise with no length of its own has no clock to fill by, so
 * it goes by whether it counts as practised.
 */
export const getExerciseFill = (
  exercise: Pick<Exercise, "timeInMinutes">,
  timeMs: number,
  isCompleted: boolean,
): number => {
  const durationMs = (exercise.timeInMinutes || 0) * 60_000;
  if (durationMs === 0) return isCompleted ? 100 : 0;
  return Math.min(100, (timeMs / durationMs) * 100);
};
