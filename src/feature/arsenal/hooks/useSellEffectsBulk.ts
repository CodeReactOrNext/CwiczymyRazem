import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { playUiSound } from "lib/uiSounds/uiSounds";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { sellEffectsBulk } from "../services/arsenal.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useSellEffectsBulk = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (inventoryItemIds: string[]) => sellEffectsBulk(inventoryItemIds),
    onSuccess: (data) => {
      dispatch(addFame(data.fameReward));
      playUiSound("reward");
      toast.success(t("toasts.sold_pedals", { count: data.soldCount, fame: data.fameReward }));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || t("toasts.err.sell_pedals");
      toast.error(message);
    },
  });
};
