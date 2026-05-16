import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { sellEffect } from "../services/arsenal.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useSellEffect = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (inventoryItemId: string) => sellEffect(inventoryItemId),
    onSuccess: (data) => {
      dispatch(addFame(data.fameReward));
      toast.success(`Sold for ${data.fameReward} Fame Points!`);
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to sell effect";
      toast.error(message);
    },
  });
};
