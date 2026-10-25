import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deductFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import {
  afterScene,
  beginScene,
  endScene,
  resolveScene,
} from "../components/Scene/sceneStore";
import { subjectFromCache } from "../components/Scene/sceneSubject";
import { getModDef } from "../data/workshop";
import { modItem } from "../services/arsenal.service";
import type {
  ArsenalUserData,
  WorkshopKind,
  WorkshopModAction,
} from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/**
 * Fits a mod out of the stash, re-rolls one that is already on the item, or
 * strips one back off.
 *
 * A re-roll can come out worse and a removal always costs level — both say so
 * plainly rather than dressing a loss up as a success, because the player chose
 * that trade and should see it land.
 *
 * With `scene`, a fit from the stash plays the fit scene instead of a toast.
 * Opt-in per screen, and only ever for a fit: the scene is the moment the mod
 * goes in, while a re-roll keeps its own roll-again loop in the slot dialog —
 * a full-screen scene per roll would stand between the player and the next one.
 * On the bench the job's result card stays under the scene, as the receipt.
 */
export const useWorkshopMod = ({ scene = false }: { scene?: boolean } = {}) => {
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
    onMutate: ({ itemId, kind, action, salvagedId }) => {
      if (!scene || action !== "fit-salvaged") return { sceneId: null };
      const subject = subjectFromCache(queryClient, kind, itemId);
      const mod = queryClient
        .getQueryData<ArsenalUserData>(ARSENAL_QUERY_KEY)
        ?.salvagedMods?.find((m) => m.id === salvagedId);
      if (!subject || !mod) return { sceneId: null };
      return {
        sceneId: beginScene({
          type: "fit",
          subject,
          featureId: mod.featureId,
          label: getModDef(kind, mod.featureId)?.label ?? mod.featureId,
        }),
      };
    },
    onSuccess: (data, _vars, sceneCtx) => {
      // Fame lives in the Redux user slice, not in this query — without the
      // mirror the header counter keeps quoting the pre-job balance until the
      // page is reloaded. Only a removal charges any. With a scene on screen it
      // waits, with the refetch below, until the scene has gone.
      afterScene(sceneCtx?.sceneId, () => {
        dispatch(deductFame(data.fameSpent ?? 0));
        queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      });

      const name = t(`labels.mod.${data.featureId}`, data.label);
      if (sceneCtx?.sceneId != null) {
        resolveScene(sceneCtx.sceneId, data);
      } else if (data.action === "fit-salvaged") {
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
    },
    onError: (error: unknown, _vars, sceneCtx) => {
      endScene(sceneCtx?.sceneId);
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || t("toasts.err.mod");
      toast.error(message);
    },
  });
};
