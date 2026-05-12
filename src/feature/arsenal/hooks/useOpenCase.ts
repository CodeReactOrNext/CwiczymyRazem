import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deductFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { CASE_DEFINITIONS } from "../data/caseDefinitions";
import { openCase } from "../services/arsenal.service";
import type { CaseType } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useOpenCase = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (caseType: CaseType) => openCase(caseType),
    onMutate: (caseType: CaseType) => {
      const cost = CASE_DEFINITIONS[caseType]?.fameCost || 0;
      dispatch(deductFame(cost));
      return { cost };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any, _caseType: CaseType, context: any) => {
      // Rollback optimistic update
      if (context?.cost) {
        dispatch(deductFame(-context.cost));
      }
      const message =
        error?.response?.data?.error || "Failed to open case";
      toast.error(message);
    },
  });
};
