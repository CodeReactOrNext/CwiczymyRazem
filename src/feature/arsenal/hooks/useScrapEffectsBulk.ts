import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";

import { scrapEffectsBulk } from "../services/arsenal.service";
import { countScrapParts } from "../utils/scrap";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useScrapEffectsBulk = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryItemIds: string[]) =>
      scrapEffectsBulk(inventoryItemIds),
    onSuccess: (data) => {
      const total = countScrapParts(data.parts);
      toast.success(
        t("toasts.scrapped_pedals", { count: data.scrappedCount, parts: total }),
        data.salvagedCount > 0
          ? {
              description: t("bulk.mods_pulled", { count: data.salvagedCount }),
            }
          : undefined,
      );
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || t("toasts.err.scrap_pedals");
      toast.error(message);
    },
  });
};
