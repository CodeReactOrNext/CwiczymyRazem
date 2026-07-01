import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { sellEffectsBulk } from "../services/arsenal.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useSellEffectsBulk = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (inventoryItemIds: string[]) => sellEffectsBulk(inventoryItemIds),
    onSuccess: (data) => {
      dispatch(addFame(data.fameReward));
      toast.success(`Sold ${data.soldCount} pedals for ${data.fameReward} Fame Points!`);
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to sell pedals";
      toast.error(message);
    },
  });
};
