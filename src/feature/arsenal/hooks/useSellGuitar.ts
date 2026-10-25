import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { playUiSound } from "lib/uiSounds/uiSounds";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { sellGuitar } from "../services/arsenal.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useSellGuitar = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (inventoryItemId: string) => sellGuitar(inventoryItemId),
    onSuccess: (data) => {
      dispatch(addFame(data.fameReward));
      playUiSound("reward");
      toast.success(t("toasts.sold_for", { fame: data.fameReward }));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || t("toasts.err.sell_guitar");
      toast.error(message);
    },
  });
};
