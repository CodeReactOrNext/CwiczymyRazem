import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PracticeLevelsState } from "feature/aiSummary/services/practiceLevels.service";
import { firebaseClaimLevel } from "feature/aiSummary/services/practiceLevels.service";
import { practiceLevelsQueryKey } from "feature/dashboard/hooks/useMilestoneProgress";
import { addFame, selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { playUiSound } from "lib/uiSounds/uiSounds";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";

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
  // From the store rather than Home's context, so What Next can claim too.
  const userAuth = useAppSelector(selectUserAuth) ?? "";
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { t } = useTranslation("dashboard");
  const queryKey = practiceLevelsQueryKey(userAuth);

  return useMutation({
    mutationFn: ({ id, reward, weekKey }: ClaimMilestoneInput) =>
      firebaseClaimLevel(userAuth, id, weekKey, reward),
    onMutate: async ({ id, reward, weekKey }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PracticeLevelsState>(queryKey);

      dispatch(addFame(reward));
      // With the optimistic Fame, not after the write: the sound is the click's answer.
      playUiSound("reward");
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
      toast.success(t("errors.claim_success", { reward, name }));
    },
    onError: (error, { reward }, context) => {
      dispatch(addFame(-reward));
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
      console.error("[claim milestone]", error);
      toast.error(t("errors.claim_failed"));
    },
  });
};
