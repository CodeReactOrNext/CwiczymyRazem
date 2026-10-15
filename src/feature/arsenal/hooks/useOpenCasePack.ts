import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deductFame, setFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { CASE_DEFINITIONS } from "../data/caseDefinitions";
import { openCasePack } from "../services/arsenal.service";
import type { CaseType } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export interface OpenCasePackInput {
  caseType: CaseType;
  count: number;
}

/** Opens a pack of the same case. Paid in Fame, one open at a time, on the server. */
export const useOpenCasePack = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ caseType, count }: OpenCasePackInput) =>
      openCasePack(caseType, count),
    onMutate: ({ caseType, count }: OpenCasePackInput) => {
      const cost = (CASE_DEFINITIONS[caseType]?.fameCost || 0) * count;
      dispatch(deductFame(cost));
      return { cost };
    },
    onSuccess: (result) => {
      // The server's figure: a pack that ran out of Fame part-way has charged
      // for fewer opens than were asked for.
      dispatch(setFame(result.newFame));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any, _input: OpenCasePackInput, context: any) => {
      if (context?.cost) dispatch(deductFame(-context.cost));
      toast.error(error?.response?.data?.error || t("toasts.err.open_case"));
    },
  });
};
