import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import {
  selectCurrentUserStats,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { fetchFeatureGoals } from "feature/whatNext/services/featureGoals.service";
import { REWARD_LEDGER_QUERY_KEY } from "hooks/useRewardLedger";
import posthog from "posthog-js";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

/** Prefix of every feature-goals query of this player, whatever the session count. */
export const featureGoalsQueryKey = (uid: string | null) =>
  ["feature-goals", uid] as const;

/** How long a look at the goals holds without a new session in between. */
const FEATURE_GOALS_STALE_MS = 15_000;

/**
 * The "use it once" goals as the server sees them. Short-lived on purpose:
 * a goal turns done when the player does the thing, and the next look at Home
 * or the screen after a session should count it.
 *
 * The session count is part of the key, so a saved session — from a plan, the
 * timer, a manual log, anywhere — asks again at once. Goals done outside a
 * session (a favourite, a case, the rig) show up on the next visit to Home
 * after a few seconds, or when the tab comes back into focus.
 *
 * A look that earns a free case pays it on the server; the toast is raised
 * here, in the fetch, so it shows once however many components read the goals.
 */
export const useFeatureGoals = () => {
  const uid = useAppSelector(selectUserAuth);
  const sessionCount = useAppSelector(selectCurrentUserStats)?.sessionCount ?? 0;
  const queryClient = useQueryClient();
  const { t } = useNextMessage();

  return useQuery({
    queryKey: [...featureGoalsQueryKey(uid), sessionCount],
    queryFn: async () => {
      const state = await fetchFeatureGoals();
      if (state.paidNow > 0) {
        toast.success(t("discover.case_collected", { count: state.paidNow }));
        posthog.capture("feature_goal_case_paid", { cases: state.paidNow });
        queryClient.invalidateQueries({ queryKey: REWARD_LEDGER_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      }
      return state;
    },
    enabled: !!uid,
    staleTime: FEATURE_GOALS_STALE_MS,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  });
};
