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

      // Parts and instruments land where the player can see them; a mod lands in
      // the stash, a tab away, so it is the one purchase that has to say so.
      if (result.kind === "mod") {
        toast.success(
          "Mod added to your stash — fit it from Collection or the bench",
        );
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Purchase failed");
    },
  });
};
