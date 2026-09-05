import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deductFame, setFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { CASE_DEFINITIONS } from "../data/caseDefinitions";
import { openCase } from "../services/arsenal.service";
import type { CaseType } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export interface OpenCaseInput {
  caseType: CaseType;
  /** Spend a free case from the achievement rewards instead of Fame. */
  useToken?: boolean;
}

export const useOpenCase = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ caseType, useToken }: OpenCaseInput) =>
      openCase(caseType, useToken === true),
    onMutate: ({ caseType, useToken }: OpenCaseInput) => {
      // A free case costs nothing, so nothing is taken off the counter for it —
      // and nothing has to be put back if the pull fails.
      if (useToken) return { cost: 0 };

      const cost = CASE_DEFINITIONS[caseType]?.fameCost || 0;
      dispatch(deductFame(cost));
      return { cost };
    },
    onSuccess: (result) => {
      // The server's figure, not the optimistic one: a token pull leaves Fame
      // untouched, and only the server knows which of the two actually paid.
      dispatch(setFame(result.newFame));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any, _input: OpenCaseInput, context: any) => {
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
