import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";

import { mergeDuplicates } from "../services/arsenal.service";
import type { WorkshopKind } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export interface MergeDuplicatesInput {
  kind: WorkshopKind;
  itemIds: string[];
}

/**
 * Folds duplicates into the best copy of their model — see `data/merge`.
 *
 * `silent` drops the success toast, for the callers that play the merge scene
 * instead: the scene already says what was gained, and a toast on top of it says
 * it twice.
 */
export const useMergeDuplicates = ({ silent = false } = {}) => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kind, itemIds }: MergeDuplicatesInput) =>
      mergeDuplicates(kind, itemIds),
    onSuccess: (result) => {
      if (!silent) {
        toast.success(
          t("toasts.merged", { count: result.merged, gain: result.gain }),
        );
      }
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || t("toasts.err.merge"));
    },
  });
};
