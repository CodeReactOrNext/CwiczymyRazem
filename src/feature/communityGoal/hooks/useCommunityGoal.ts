import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  claimGoalReward,
  fetchCommunityGoal,
  voteForGoal,
} from "feature/communityGoal/services/communityGoal.service";
import type { CommunityGoalState } from "feature/communityGoal/types/communityGoal.types";
import { toast } from "sonner";

export const COMMUNITY_GOAL_KEY = ["community-goal"] as const;

/** The bar moves session by session, so a minute of staleness is invisible. */
const STALE_TIME = 60 * 1000;

export const useCommunityGoal = (enabled = true) =>
  useQuery({
    queryKey: COMMUNITY_GOAL_KEY,
    queryFn: fetchCommunityGoal,
    enabled,
    staleTime: STALE_TIME,
  });

const errorMessage = (error: unknown, fallback: string): string => {
  const responseError = (error as { response?: { data?: { error?: string } } })
    ?.response?.data?.error;
  return responseError || fallback;
};

export const useCommunityGoalMutations = () => {
  const queryClient = useQueryClient();

  const applyState = (state: CommunityGoalState) =>
    queryClient.setQueryData(COMMUNITY_GOAL_KEY, state);

  const vote = useMutation({
    mutationFn: (candidateId: string) => voteForGoal(candidateId),
    onSuccess: applyState,
    onError: (error) =>
      toast.error(errorMessage(error, "Could not spend that token")),
  });

  const claim = useMutation({
    mutationFn: claimGoalReward,
    onSuccess: (state) => {
      applyState(state);
      toast.success(`+${state.reward.fame} Fame — the community pulled it off`);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not claim the reward")),
  });

  return { vote, claim };
};
