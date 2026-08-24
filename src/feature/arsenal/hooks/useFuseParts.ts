import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { getPartLabel } from "../data/partDefinitions";
import { fuseParts } from "../services/arsenal.service";
import type { PartId, PartTier } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

interface FusePartsInput {
  partId: PartId;
  tier: PartTier;
  /** Pieces to produce — the bench bills per piece that comes out. */
  crafts: number;
}

/**
 * Reworks a stack of parts up a tier. Counts and the Fame fee live in
 * `data/fusion.ts`; the server recomputes both before anything is spent.
 */
export const useFuseParts = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ partId, tier, crafts }: FusePartsInput) =>
      fuseParts(partId, tier, crafts),
    onSuccess: (data) => {
      // Negative: the fee left the player's balance.
      dispatch(addFame(-data.fameSpent));
      toast.success(
        `Reworked into ${data.produced.qty}× ${data.produced.tier} ${getPartLabel(
          data.produced.partId,
        )}!`,
      );
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to rework parts";
      toast.error(message);
    },
  });
};
