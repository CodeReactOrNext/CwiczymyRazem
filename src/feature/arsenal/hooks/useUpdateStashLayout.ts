import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateStashLayout } from "../services/arsenal.service";
import type { ArsenalUserData } from "../types/arsenal.types";
import type { StashLayout } from "../utils/stashLayout";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/**
 * Saves where the player parked their gear.
 *
 * The board is already showing the new arrangement by the time this runs, so
 * the cache is written straight away and never re-fetched on success — a drop
 * that reflows the whole stash a moment later would undo the point of dragging
 * anything. A failed save says so and pulls the stored arrangement back.
 *
 * Every drop writes the whole map, and arranging a stash is a burst of drops, so
 * the saves are scoped: they run one after another in the order they were made.
 * Left to race, two writes in flight at once can land back to front and restore
 * an arrangement the player already moved on from.
 */
export const useUpdateStashLayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    scope: { id: "arsenal-stash-layout" },
    mutationFn: (layout: StashLayout) => updateStashLayout(layout),
    onMutate: (layout: StashLayout) => {
      queryClient.setQueryData<ArsenalUserData & { fame: number }>(
        ARSENAL_QUERY_KEY,
        (prev) => (prev ? { ...prev, stashLayout: layout } : prev),
      );
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error || "Failed to save your stash layout";
      toast.error(message);
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
  });
};
