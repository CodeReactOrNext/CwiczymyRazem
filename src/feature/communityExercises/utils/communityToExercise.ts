import type { CommunityExercise } from "feature/communityExercises/types";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

const COMMUNITY_ID_PREFIX = "community-";

/** Prefix keeps ids from the community collection apart from the built-in
 *  library ones — and makes the same exercise resolve to the same id whether it
 *  was picked from the Community tab, from My Exercises or for a goal. */
export const communityExerciseId = (id: string) =>
  `${COMMUNITY_ID_PREFIX}${id}`;

/** The community doc behind an exercise id; null for a library exercise. */
export const communityDocId = (exerciseId: string): string | null =>
  exerciseId.startsWith(COMMUNITY_ID_PREFIX) &&
  exerciseId.length > COMMUNITY_ID_PREFIX.length
    ? exerciseId.slice(COMMUNITY_ID_PREFIX.length)
    : null;

export const communityToExercise = (ce: CommunityExercise): Exercise => ({
  id: communityExerciseId(ce.id),
  title: ce.title,
  description: ce.description,
  category: ce.category,
  difficulty: ce.difficulty,
  timeInMinutes: ce.timeInMinutes,
  instructions: ce.instructions,
  tips: ce.tips,
  metronomeSpeed: ce.metronomeSpeed,
  relatedSkills: ce.relatedSkills,
  tablature: ce.tablature,
  videoUrl: ce.videoUrl,
  imageUrl: ce.imageUrl,
  gpFileUrl: ce.gpFileUrl,
  backingTracks: ce.backingTracks,
});
