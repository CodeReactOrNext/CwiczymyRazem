import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deductFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { commissionItem } from "../services/arsenal.service";
import type { WorkshopKind } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/**
 * Orders a model from the bench. The price and every eligibility rule are
 * recomputed server-side from the stored account.
 */
export const useWorkshopCommission = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({
      kind,
      definitionId,
    }: {
      kind: WorkshopKind;
      definitionId: number | string;
    }) => commissionItem(kind, definitionId),
    onSuccess: (data) => {
      // Fame lives in the Redux user slice, not in this query — mirrored so
      // the header counter and the next quote stop showing the old balance.
      dispatch(deductFame(data.fameSpent ?? 0));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to commission";
      toast.error(message);
    },
  });
};
