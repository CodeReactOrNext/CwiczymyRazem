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
import { getModDef } from "../data/workshop";
import { scrapGuitar } from "../services/arsenal.service";
import { countScrapParts } from "../utils/scrap";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useScrapGuitar = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryItemId: string) => scrapGuitar(inventoryItemId),
    // The teardown plays on screen when the arsenal can show it; the toast is
    // for anywhere it cannot.
    onMutate: (inventoryItemId) => {
      const subject = subjectFromCache(queryClient, "guitar", inventoryItemId);
      return {
        sceneId: subject
          ? beginScene({ type: "teardown", subjects: [subject], count: 1 })
          : null,
      };
    },
    onSuccess: (data, _id, scene) => {
      // Held until the scene has gone: the refetch re-renders the whole tab.
      afterScene(scene?.sceneId, () =>
        queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY }),
      );
      if (scene?.sceneId != null) {
        resolveScene(scene.sceneId, data);
        return;
      }
      const total = countScrapParts(data.parts);
      // The mod that survived is the part of a teardown worth naming — it is a
      // thing now sitting in the stash, not another number in the wallet.
      const salvaged = data.salvaged
        ? getModDef("guitar", data.salvaged.featureId)
        : null;
      toast.success(
        t("toasts.scrapped", { count: total }),
        salvaged
          ? {
              description: t("toasts.mod_pulled", {
                name: t(`labels.mod.${data.salvaged!.featureId}`, salvaged.label),
                points: data.salvaged!.points,
              }),
            }
          : undefined,
      );
    },
    onError: (error: unknown, _id, scene) => {
      endScene(scene?.sceneId);
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        t("toasts.err.scrap_guitar");
      toast.error(message);
    },
  });
};
