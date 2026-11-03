import { queryOptions } from "@tanstack/react-query";
import {
  getCommunityExercises,
  getUserCommunityExercises,
} from "feature/communityExercises/services/communityExerciseService";

/**
 * Cached, so a return visit (or switching back to the Community tab, which
 * remounts it) shows the list at once instead of a skeleton. Re-read on every
 * mount all the same: exercises get published, edited and rated on other pages,
 * and a list shown from the cache must not stay behind those.
 */
export const communityExercisesQuery = () =>
  queryOptions({
    queryKey: ["community-exercises", "public"],
    queryFn: getCommunityExercises,
    refetchOnMount: "always",
  });

/** The player's own exercises (`/my-exercises`), public and private. */
export const userCommunityExercisesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["community-exercises", "user", userId],
    queryFn: () => getUserCommunityExercises(userId),
    refetchOnMount: "always",
  });
