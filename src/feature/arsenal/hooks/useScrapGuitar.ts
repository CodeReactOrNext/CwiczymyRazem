import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getModDef } from "../data/workshop";
import { scrapGuitar } from "../services/arsenal.service";
import { countScrapParts } from "../utils/scrap";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useScrapGuitar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryItemId: string) => scrapGuitar(inventoryItemId),
    onSuccess: (data) => {
      const total = countScrapParts(data.parts);
      // The mod that survived is the part of a teardown worth naming — it is a
      // thing now sitting in the stash, not another number in the wallet.
      const salvaged = data.salvaged
        ? getModDef("guitar", data.salvaged.featureId)
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
        "Failed to scrap guitar";
      toast.error(message);
    },
  });
};
