import type { Exercise } from "feature/exercisePlan/types/exercise.types";

/**
 * Whether an exercise can get a generated backing: it has to be a tab
 * exercise, and nothing else may already speak for its accompaniment — its
 * own backing tracks or Guitar Pro file, a song, a riddle or ear quiz whose
 * phrase has to be heard alone, a playalong video, or an author who switched
 * backing off on purpose (the hunts and click drills do).
 */
export function isAutoBackingEligible(exercise: Exercise): boolean {
  if (!exercise.tablature?.length) return false;
  if (exercise.backingTracks?.length || exercise.gpFileUrl) return false;
  if (exercise.disableBackingTrack || exercise.isPlayalong) return false;
  if (exercise.songData || exercise.riddleConfig || exercise.earQuizConfig)
    return false;
  return true;
}
