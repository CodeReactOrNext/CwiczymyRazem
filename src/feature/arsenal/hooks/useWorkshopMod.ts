import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deductFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { modItem } from "../services/arsenal.service";
import type { WorkshopKind, WorkshopModAction } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/**
 * Fits a mod out of the stash, re-rolls one that is already on the item, or
 * strips one back off.
 *
 * A re-roll can come out worse and a removal always costs level — both say so
 * plainly rather than dressing a loss up as a success, because the player chose
 * that trade and should see it land.
 */
export const useWorkshopMod = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({
      itemId,
      kind,
      featureId,
      action,
      salvagedId,
    }: {
      itemId: string;
      kind: WorkshopKind;
      /** Null on a fit — the stash entry names the feature. */
      featureId: string | null;
      action: WorkshopModAction;
      salvagedId?: string;
    }) => modItem(itemId, kind, featureId, action, salvagedId),
    onSuccess: (data) => {
      // Fame lives in the Redux user slice, not in this query — without the
      // mirror the header counter keeps quoting the pre-job balance until the
      // page is reloaded. Only a removal charges any.
      dispatch(deductFame(data.fameSpent ?? 0));

      if (data.action === "fit-salvaged") {
        toast.success(`${data.label} fitted — +${data.points} level`);
      } else if (data.action === "remove") {
        toast(`${data.label} taken off — the mod is gone, the slot is free`);
      } else if (data.levelGain > 0) {
        toast.success(
          `${data.label} re-spec — +${data.pointsBefore} → +${data.points}`,
        );
      } else {
        toast(
          `${data.label} re-spec — +${data.pointsBefore} → +${data.points}`,
        );
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
