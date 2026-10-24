import { useQuery } from "@tanstack/react-query";
import { getPublicExercisePlans } from "feature/exercisePlan/services/getPublicExercisePlans";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";

// Same key as AddToPlanMenu, so adding an exercise there refreshes these lists too.
export const userPlansQueryKey = (userId: string | null | undefined) => [
  "user-exercise-plans",
  userId,
];

export const publicPlansQueryKey = ["public-exercise-plans"];

/**
 * The player's own plans. /timer/plans reads them both in the page (to resolve
 * ?planId=) and in PlanSelector — one shared query instead of two identical
 * Firestore reads per visit.
 */
export const useUserExercisePlans = (userId: string | null | undefined) =>
  useQuery({
    queryKey: userPlansQueryKey(userId),
    queryFn: () => getUserExercisePlans(userId as string),
    enabled: !!userId,
    // Plans are created/edited on other screens that don't invalidate this key:
    // show the cached list at once, but always refresh it in the background.
    staleTime: 0,
  });

/** Community (public) plans, with author names backfilled. */
export const usePublicExercisePlans = (enabled = true) =>
  useQuery({
    queryKey: publicPlansQueryKey,
    queryFn: getPublicExercisePlans,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
