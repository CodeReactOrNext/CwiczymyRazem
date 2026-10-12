import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";

import { getModDef } from "../data/workshop";
import { scrapEffect } from "../services/arsenal.service";
import { countScrapParts } from "../utils/scrap";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useScrapEffect = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryItemId: string) => scrapEffect(inventoryItemId),
    onSuccess: (data) => {
      const total = countScrapParts(data.parts);
      const salvaged = data.salvaged
        ? getModDef("effect", data.salvaged.featureId)
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
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        t("toasts.err.scrap_effect");
      toast.error(message);
    },
  });
};
