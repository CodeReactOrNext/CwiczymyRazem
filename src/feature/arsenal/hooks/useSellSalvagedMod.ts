import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { sellSalvagedMod } from "../services/arsenal.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/** Sells one rescued mod out of the stash. See `data/resale.ts` for the price. */
export const useSellSalvagedMod = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (modId: string) => sellSalvagedMod(modId),
    onSuccess: (data) => {
      dispatch(addFame(data.fameReward));
      toast.success(t("toasts.sold_for", { fame: data.fameReward }));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || t("toasts.err.sell_mod");
      toast.error(message);
    },
  });
};
