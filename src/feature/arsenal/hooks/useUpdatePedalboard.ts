import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { memoryCache } from "utils/cache/memoryCache";

import { updatePedalboard } from "../services/arsenal.service";
import type {
  ArsenalUserData,
  PedalboardPlacement,
  PowerLink,
} from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/** Positions and DC cables travel together — one board, one save. */
export interface PedalboardUpdate {
  items: PedalboardPlacement[];
  power: PowerLink[];
}

export const useUpdatePedalboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ items, power }: PedalboardUpdate) =>
      updatePedalboard(items, power),
    onMutate: ({ items, power }: PedalboardUpdate) => {
      // Update cache directly — no re-fetch
      queryClient.setQueryData<ArsenalUserData & { fame: number }>(
        ARSENAL_QUERY_KEY,
        (prev) =>
          prev
            ? { ...prev, rig: { ...prev.rig, pedalboardItems: items, power } }
            : prev,
      );
    },
    onSuccess: () => {
      // Pedalboard changed → gear leaderboard caches are stale
      memoryCache.clear("leaderboard:gear");
      memoryCache.clear("userRank:gear");
      queryClient.invalidateQueries({ queryKey: ["userGearLevel"] });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error || "Failed to update pedalboard";
      toast.error(message);
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
  });
};
