import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  claimGettingStartedReward,
  fetchGettingStartedQuest,
  updateGettingStartedQuest,
} from "../services/gettingStartedQuest.service";
import type { GettingStartedQuestState } from "../types";

export const gettingStartedQuestKey = (userId?: string | null) =>
  ["gettingStartedQuest", userId] as const;

export const useGettingStartedQuest = (userId?: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = gettingStartedQuestKey(userId);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchGettingStartedQuest(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const markStep = useMutation({
    mutationFn: (patch: Partial<GettingStartedQuestState>) =>
      updateGettingStartedQuest(userId as string, patch),
    onSuccess: (_, patch) => {
      queryClient.setQueryData<GettingStartedQuestState | undefined>(queryKey, (old) =>
        old ? { ...old, ...patch } : old
      );
    },
  });

  const claimReward = useMutation({
    mutationFn: (fameAmount: number) => claimGettingStartedReward(userId as string, fameAmount),
    onSuccess: () => {
      queryClient.setQueryData<GettingStartedQuestState | undefined>(queryKey, (old) =>
        old ? { ...old, rewardClaimed: true } : old
      );
    },
  });

  return {
    quest: query.data,
    isLoading: query.isLoading,
    markStep: markStep.mutate,
    claimReward: claimReward.mutateAsync,
    isClaiming: claimReward.isPending,
  };
};
