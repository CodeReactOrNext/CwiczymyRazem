import { isGoalEligibleExercise } from "feature/exerciseGoals/utils/goalRules";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { PRACTICE_GOALS_SHOWCASE } from "feature/landing/data/practiceGoals";

export interface PracticeGoalsPageProps {
  /** The showcase exercise's title, as the library names it today. */
  exerciseTitle: string;
  /** How many library exercises can take a goal. */
  eligibleCount: number;
}

/**
 * Read at build time so the page never ships the exercise catalogue. Fails
 * the build if the showcase exercise could no longer take a goal.
 */
export const buildPracticeGoalsProps = (): PracticeGoalsPageProps => {
  const exercise = exercisesAgregat.find(
    (entry) => entry.id === PRACTICE_GOALS_SHOWCASE.exerciseId,
  );
  if (!exercise || !isGoalEligibleExercise(exercise)) {
    throw new Error(
      `Practice goals landing: "${PRACTICE_GOALS_SHOWCASE.exerciseId}" cannot take a goal`,
    );
  }
  return {
    exerciseTitle: exercise.title,
    eligibleCount: exercisesAgregat.filter(isGoalEligibleExercise).length,
  };
};
