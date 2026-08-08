import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { buildItem } from "../services/arsenal.service";
import type { WorkshopKind } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/** Buys one build level. The bill is recomputed server-side from the stored item. */
export const useWorkshopBuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, kind }: { itemId: string; kind: WorkshopKind }) =>
      buildItem(itemId, kind),
    onSuccess: (data) => {
      toast.success(
        `${data.modName} fitted — Build ${data.buildLevel}, +${data.levelGain} level`,
      );
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to build";
      toast.error(message);
    },
  });
};
