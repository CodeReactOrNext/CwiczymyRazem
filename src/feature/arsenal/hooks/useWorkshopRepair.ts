import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { repairItem } from "../services/arsenal.service";
import type { WorkshopKind } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/** Restores one condition grade. Raises Item Level, never the game's buy-back price. */
export const useWorkshopRepair = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, kind }: { itemId: string; kind: WorkshopKind }) =>
      repairItem(itemId, kind),
    onSuccess: (data) => {
      toast.success(`Restored to ${data.grade} — +${data.levelGain} level`);
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to repair";
      toast.error(message);
    },
  });
};
