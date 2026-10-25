import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";

import {
  afterScene,
  beginScene,
  endScene,
  resolveScene,
} from "../components/Scene/sceneStore";
import { itemFromCache, subjectOfItem } from "../components/Scene/sceneSubject";
import { getItemCondition } from "../data/itemStats";
import { repairItem } from "../services/arsenal.service";
import type { WorkshopKind } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/** Restores one condition grade. Raises Item Level, never the game's buy-back price. */
export const useWorkshopRepair = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, kind }: { itemId: string; kind: WorkshopKind }) =>
      repairItem(itemId, kind),
    // The restoration plays as a cleaning: it needs the condition the item
    // walked in with, which the answer no longer carries.
    onMutate: ({ itemId, kind }) => {
      const item = itemFromCache(queryClient, kind, itemId);
      const subject = item ? subjectOfItem(kind, item) : null;
      return {
        sceneId:
          item && subject
            ? beginScene({
                type: "restore",
                subject,
                conditionBefore: getItemCondition(item),
              })
            : null,
      };
    },
    onSuccess: (data, _vars, scene) => {
      // The refetch re-renders the tab underneath, so it waits for the scene.
      afterScene(scene?.sceneId, () =>
        queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY }),
      );
      if (scene?.sceneId != null) {
        resolveScene(scene.sceneId, data);
        return;
      }
      toast.success(t("toasts.restored", {
          grade: t(`labels.condition.${data.grade}`, data.grade),
          gain: data.levelGain,
        }));
    },
    onError: (error: unknown, _vars, scene) => {
      endScene(scene?.sceneId);
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || t("toasts.err.repair");
      toast.error(message);
    },
  });
};
