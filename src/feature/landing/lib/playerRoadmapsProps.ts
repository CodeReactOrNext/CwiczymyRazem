import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { ROADMAP_STEP_EXAMPLE } from "feature/landing/data/playerRoadmapExamples";

export interface PlayerRoadmapsPageProps {
  /** The example step's exercise, as the library names it today. */
  stepExerciseTitle: string;
}

/**
 * Read at build time so the page never ships the exercise catalogue. A renamed
 * exercise follows on the next build; a deleted one fails it, rather than the
 * page naming a drill that no longer exists.
 */
export const buildPlayerRoadmapsProps = (): PlayerRoadmapsPageProps => {
  const exercise = exercisesAgregat.find(
    (entry) => entry.id === ROADMAP_STEP_EXAMPLE.exerciseId,
  );
  if (!exercise) {
    throw new Error(
      `Player Roadmaps landing: exercise "${ROADMAP_STEP_EXAMPLE.exerciseId}" is not in the library`,
    );
  }
  return { stepExerciseTitle: exercise.title };
};
