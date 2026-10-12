import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { sellGuitarsBulk } from "../services/arsenal.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useSellGuitarsBulk = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (inventoryItemIds: string[]) => sellGuitarsBulk(inventoryItemIds),
    onSuccess: (data) => {
      dispatch(addFame(data.fameReward));
      toast.success(t("toasts.sold_guitars", { count: data.soldCount, fame: data.fameReward }));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || t("toasts.err.sell_guitars");
      toast.error(message);
    },
  });
};
