import {
  getCommunityExerciseById,
  getUserCommunityExercises,
} from "feature/communityExercises/services/communityExerciseService";
import {
  communityDocId,
  communityToExercise,
} from "feature/communityExercises/utils/communityToExercise";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/**
 * The exercise a goal is set on: one from the library, or one the player wrote
 * in the Tab Editor (read fresh, so an edited tab is the one played). Null when
 * it's gone — deleted, or no longer readable.
 */
export const getGoalExercise = async (
  exerciseId: string,
): Promise<Exercise | null> => {
  const docId = communityDocId(exerciseId);
  if (!docId)
    return (
      exercisesAgregat.find((exercise) => exercise.id === exerciseId) ?? null
    );
  const community = await getCommunityExerciseById(docId);
  return community ? communityToExercise(community) : null;
};

/** The player's own exercises, private ones included, newest first. */
export const getOwnExercises = async (uid: string): Promise<Exercise[]> =>
  (await getUserCommunityExercises(uid)).map(communityToExercise);
