import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { scrapGuitarsBulk } from "../services/arsenal.service";
import { countScrapParts } from "../utils/scrap";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useScrapGuitarsBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryItemIds: string[]) =>
      scrapGuitarsBulk(inventoryItemIds),
    onSuccess: (data) => {
      const total = countScrapParts(data.parts);
      toast.success(
        `Scrapped ${data.scrappedCount} guitars for ${total} ${total === 1 ? "part" : "parts"}!`,
        data.salvagedCount > 0
          ? {
              description: `${data.salvagedCount} ${
                data.salvagedCount === 1 ? "mod" : "mods"
              } pulled out and stashed`,
            }
          : undefined,
      );
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to scrap guitars";
      toast.error(message);
    },
  });
};
