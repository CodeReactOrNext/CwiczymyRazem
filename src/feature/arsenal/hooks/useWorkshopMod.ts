import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { modItem } from "../services/arsenal.service";
import type {
  WorkshopKind,
  WorkshopModAction,
} from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/**
 * Fits a mod, or re-rolls one that is already on the item.
 *
 * A re-roll can come out worse — the toast says so plainly rather than dressing a
 * loss up as a success, because the player chose that risk and should see it land.
 */
export const useWorkshopMod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      kind,
      featureId,
      action,
    }: {
      itemId: string;
      kind: WorkshopKind;
      featureId: string;
      action: WorkshopModAction;
    }) => modItem(itemId, kind, featureId, action),
    onSuccess: (data) => {
      if (data.action === "fit") {
        toast.success(`${data.label} fitted — +${data.points} level`);
      } else if (data.levelGain > 0) {
        toast.success(
          `${data.label} re-spec — +${data.pointsBefore} → +${data.points}`,
        );
      } else {
        toast(`${data.label} re-spec — +${data.pointsBefore} → +${data.points}`);
      }
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fit the mod";
      toast.error(message);
    },
  });
};
