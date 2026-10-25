import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";

import {
  afterScene,
  beginScene,
  endScene,
  resolveScene,
} from "../components/Scene/sceneStore";
import { subjectFromCache } from "../components/Scene/sceneSubject";
import { scrapGuitarsBulk } from "../services/arsenal.service";
import { countScrapParts } from "../utils/scrap";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useScrapGuitarsBulk = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryItemIds: string[]) =>
      scrapGuitarsBulk(inventoryItemIds),
    // One teardown for the whole sweep, drawn as the front of the pile.
    onMutate: (inventoryItemIds) => {
      const subjects = inventoryItemIds
        .slice(0, 3)
        .map((id) => subjectFromCache(queryClient, "guitar", id))
        .filter((s) => s !== null);
      return {
        sceneId:
          subjects.length > 0
            ? beginScene({
                type: "teardown",
                subjects,
                count: inventoryItemIds.length,
              })
            : null,
      };
    },
    onSuccess: (data, _ids, scene) => {
      // Held until the scene has gone: the refetch re-renders the whole tab.
      afterScene(scene?.sceneId, () =>
        queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY }),
      );
      if (scene?.sceneId != null) {
        resolveScene(scene.sceneId, data);
        return;
      }
      const total = countScrapParts(data.parts);
      toast.success(
        t("toasts.scrapped_guitars", { count: data.scrappedCount, parts: total }),
        data.salvagedCount > 0
          ? {
              description: t("bulk.mods_pulled", { count: data.salvagedCount }),
            }
          : undefined,
      );
    },
    onError: (error: unknown, _ids, scene) => {
      endScene(scene?.sceneId);
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || t("toasts.err.scrap_guitars");
      toast.error(message);
    },
  });
};
