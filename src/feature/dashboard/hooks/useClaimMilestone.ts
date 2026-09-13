import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PracticeLevelsState } from "feature/aiSummary/services/practiceLevels.service";
import { firebaseClaimLevel } from "feature/aiSummary/services/practiceLevels.service";
import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import { practiceLevelsQueryKey } from "feature/dashboard/hooks/useMilestoneProgress";
import { addFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

export interface ClaimMilestoneInput {
  id: number;
  name: string;
  reward: number;
  weekKey: string;
}

/**
 * Collects one weekly milestone reward from its card on Home, the same way the
 * Milestones page does: the Fame lands in the store and the claim in the cache
 * straight away, and both go back if the write fails.
 */
export const useClaimMilestone = () => {
  const { userAuth } = useDashboardData();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const queryKey = practiceLevelsQueryKey(userAuth);

  return useMutation({
    mutationFn: ({ id, reward, weekKey }: ClaimMilestoneInput) =>
      firebaseClaimLevel(userAuth, id, weekKey, reward),
    onMutate: async ({ id, reward, weekKey }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PracticeLevelsState>(queryKey);

      dispatch(addFame(reward));
      if (previous) {
        queryClient.setQueryData<PracticeLevelsState>(queryKey, {
          ...previous,
          claims: {
            ...previous.claims,
            [id]: { weekKey, claimedAt: new Date().toISOString() },
          },
        });
      }
      return { previous };
    },
    onSuccess: (_data, { name, reward }) => {
      toast.success(`+${reward} Fame from ${name}`);
    },
    onError: (error, { reward }, context) => {
      dispatch(addFame(-reward));
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
      console.error("[claim milestone]", error);
      toast.error("Claim failed");
    },
  });
};
