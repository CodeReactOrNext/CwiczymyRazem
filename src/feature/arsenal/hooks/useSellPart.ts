import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { playUiSound } from "lib/uiSounds/uiSounds";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { sellPart } from "../services/arsenal.service";
import type { PartId, PartTier } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

interface SellPartInput {
  partId: PartId;
  tier: PartTier;
  /** How many pieces off the stack — the whole stack unless the player says otherwise. */
  qty: number;
}

/** Sells loose parts out of the stash. See `data/resale.ts` for the price. */
export const useSellPart = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ partId, tier, qty }: SellPartInput) =>
      sellPart(partId, tier, qty),
    onSuccess: (data) => {
      dispatch(addFame(data.fameReward));
      playUiSound("reward");
      toast.success(t("toasts.sold_for", { fame: data.fameReward }));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || t("toasts.err.sell_parts");
      toast.error(message);
    },
  });
};
