import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { addFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { sellComponent } from "../services/buildGuitar.service";

/** Sells one Builder part out of the stash — see `getComponentResaleValue`. */
export const useSellComponent = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: sellComponent,
    onSuccess: (data) => {
      dispatch(addFame(data.fameReward));
      toast.success(`Sold for ${data.fameReward} Fame Points!`);
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to sell part";
      toast.error(message);
    },
  });
};
