import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deductFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
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
  const { t } = useTranslation("arsenal");
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

      const name = t(`labels.mod.${data.featureId}`, data.label);
      if (data.action === "fit-salvaged") {
        toast.success(t("toasts.mod_fitted", { name, points: data.points }));
      } else if (data.action === "remove") {
        toast(t("toasts.mod_removed", { name }));
      } else if (data.levelGain > 0) {
        toast.success(
          t("toasts.mod_respec", { name, before: data.pointsBefore, after: data.points }),
        );
      } else {
        toast(
          t("toasts.mod_respec", { name, before: data.pointsBefore, after: data.points }),
        );
      }
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || t("toasts.err.mod");
      toast.error(message);
    },
  });
};
