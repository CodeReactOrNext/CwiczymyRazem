import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { isClickAnsweredMode } from "feature/exercisePlan/utils/huntModes";

/**
 * Returns true for exercises the player can do with empty hands — the ones
 * answered by tapping the screen instead of playing a note: the click-to-answer
 * ear quizzes (EarQuizPanel) and the fretboard click hunts (ClickHuntPanel /
 * IntervalClickPanel). Everything else is assumed to need the instrument, so a
 * new exercise never lands in the "no guitar" list by accident; exercises that
 * can't be told apart by their config opt in with `noGuitarNeeded`.
 */
export const isNoGuitarExercise = (
  exercise: Pick<Exercise, "noGuitarNeeded" | "earQuizConfig" | "noteHuntConfig">
): boolean => {
  if (exercise.noGuitarNeeded !== undefined) return exercise.noGuitarNeeded;
  return !!exercise.earQuizConfig || isClickAnsweredMode(exercise.noteHuntConfig?.mode);
};
