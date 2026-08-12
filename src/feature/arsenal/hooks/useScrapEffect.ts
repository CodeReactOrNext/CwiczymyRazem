import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getModDef } from "../data/workshop";
import { scrapEffect } from "../services/arsenal.service";
import { countScrapParts } from "../utils/scrap";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useScrapEffect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryItemId: string) => scrapEffect(inventoryItemId),
    onSuccess: (data) => {
      const total = countScrapParts(data.parts);
      const salvaged = data.salvaged
        ? getModDef("effect", data.salvaged.featureId)
        : null;
      toast.success(
        `Scrapped for ${total} ${total === 1 ? "part" : "parts"}!`,
        salvaged
          ? {
              description: `${salvaged.label} +${data.salvaged!.points} pulled out and stashed`,
            }
          : undefined,
      );
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to scrap effect";
      toast.error(message);
    },
  });
};
