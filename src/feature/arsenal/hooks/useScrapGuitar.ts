import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { scrapGuitar } from "../services/arsenal.service";
import { countScrapParts } from "../utils/scrap";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useScrapGuitar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryItemId: string) => scrapGuitar(inventoryItemId),
    onSuccess: (data) => {
      const total = countScrapParts(data.parts);
      toast.success(`Scrapped for ${total} ${total === 1 ? "part" : "parts"}!`);
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to scrap guitar";
      toast.error(message);
    },
  });
};
