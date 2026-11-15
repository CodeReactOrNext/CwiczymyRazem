import { recordCommunityExercisePlay } from "feature/communityExercises/services/communityExerciseService";
import { communityDocId } from "feature/communityExercises/utils/communityToExercise";
import { useEffect, useRef } from "react";

/**
 * The community doc behind the exercise a session has open, or null for a
 * library exercise. Plans, goals and the calendar carry the `community-<id>`
 * form; the Community tab starts a session on the bare doc id and names it in
 * `bareCommunityId`.
 */
export const resolveCommunityPlayId = (
  exerciseId: string | undefined,
  bareCommunityId?: string,
): string | null => {
  if (!exerciseId) return null;
  return (
    communityDocId(exerciseId) ??
    (bareCommunityId && exerciseId === bareCommunityId ? exerciseId : null)
  );
};

/**
 * Counts a play of a community exercise as soon as the session opens it —
 * finishing it isn't required. Each exercise counts once per session, so
 * stepping back and forth through a plan doesn't inflate the number.
 */
export const useCommunityPlayCount = (
  exerciseId: string | undefined,
  userId: string | null,
  bareCommunityId?: string,
) => {
  const counted = useRef<Set<string> | null>(null);

  useEffect(() => {
    const docId = resolveCommunityPlayId(exerciseId, bareCommunityId);
    if (!docId || !userId) return;
    counted.current ??= new Set();
    if (counted.current.has(docId)) return;
    counted.current.add(docId);
    void recordCommunityExercisePlay(docId, userId);
  }, [exerciseId, bareCommunityId, userId]);
};
