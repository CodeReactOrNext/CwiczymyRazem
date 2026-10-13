import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";

import { scrapGuitarsBulk } from "../services/arsenal.service";
import { countScrapParts } from "../utils/scrap";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useScrapGuitarsBulk = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryItemIds: string[]) =>
      scrapGuitarsBulk(inventoryItemIds),
    onSuccess: (data) => {
      const total = countScrapParts(data.parts);
      toast.success(
        t("toasts.scrapped_guitars", { count: data.scrappedCount, parts: total }),
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
          ?.error || t("toasts.err.scrap_guitars");
      toast.error(message);
    },
  });
};
