import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deductFame, setFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";
import { memoryCache } from "utils/cache/memoryCache";

import type { HardwareKind, UpgradeRigResult } from "../data/rigHardware";
import { upgradeRig } from "../services/arsenal.service";
import type { ArsenalUserData } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/**
 * Buys the next case or the next brick.
 *
 * No optimistic write: unlike a pedal being dragged, this is money leaving the
 * wallet, and a board that changes shape a moment before the server agrees it
 * has been paid for is a board that can change back. The cached rig is patched
 * from the *response*, and the wallet is debited by what the server says it
 * charged — never by the price the card happened to be showing.
 */
export const useUpgradeRig = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (kind: HardwareKind) => upgradeRig(kind),
    onSuccess: (result: UpgradeRigResult) => {
      dispatch(deductFame(result.spent));
      queryClient.setQueryData<ArsenalUserData & { fame: number }>(
        ARSENAL_QUERY_KEY,
        (prev) =>
          prev
            ? {
                ...prev,
                fame: result.newFame,
                rig: {
                  ...prev.rig,
                  ...(result.kind === "board"
                    ? { boardTier: result.tier }
                    : { supplyTier: result.tier }),
                },
              }
            : prev,
      );

      // A bigger case holds more pedals and a bigger brick powers more of them,
      // so both move the gear score the leaderboard sorts on.
      memoryCache.clear("leaderboard:gear");
      memoryCache.clear("userRank:gear");
      queryClient.invalidateQueries({ queryKey: ["userGearLevel"] });

      toast.success(
        result.kind === "board"
          ? `${result.name} bolted in — ${result.spent} Fame`
          : `${result.name} racked up — ${result.spent} Fame`,
      );
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Could not buy the upgrade");

      // A refusal for want of Fame comes back with the wallet the server
      // actually holds. Taking it is what stops the card offering the same
      // upgrade again: the balance here only ever moves by deltas, so once one
      // of the writes behind those deltas has failed to land it reads high for
      // the rest of the session — and every press is refused for a shortfall
      // the player cannot see.
      const have = error?.response?.data?.have;
      if (typeof have === "number") dispatch(setFame(have));

      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
  });
};
