import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deductFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import type { BuyTraderOfferInput } from "../services/trader.service";
import { buyTraderOffer } from "../services/trader.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useBuyTraderOffer = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (input: BuyTraderOfferInput) => buyTraderOffer(input),
    onSuccess: (result) => {
      // Deducted after the fact, from what the server actually charged — the
      // price depends on the window's stock, which the client must not assume.
      dispatch(deductFame(result.spent));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Purchase failed");
    },
  });
};
