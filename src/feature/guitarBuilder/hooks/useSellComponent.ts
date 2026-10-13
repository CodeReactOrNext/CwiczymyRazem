import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { addFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { sellComponent } from "../services/buildGuitar.service";

/** Sells one Builder part out of the stash — see `getComponentResaleValue`. */
export const useSellComponent = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: sellComponent,
    onSuccess: (data) => {
      dispatch(addFame(data.fameReward));
      toast.success(t("toasts.sold_for", { fame: data.fameReward }));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? t("toasts.err.sell_parts");
      toast.error(message);
    },
  });
};
