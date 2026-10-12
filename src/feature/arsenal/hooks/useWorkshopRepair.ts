import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";

import { repairItem } from "../services/arsenal.service";
import type { WorkshopKind } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/** Restores one condition grade. Raises Item Level, never the game's buy-back price. */
export const useWorkshopRepair = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, kind }: { itemId: string; kind: WorkshopKind }) =>
      repairItem(itemId, kind),
    onSuccess: (data) => {
      toast.success(t("toasts.restored", {
          grade: t(`labels.condition.${data.grade}`, data.grade),
          gain: data.levelGain,
        }));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || t("toasts.err.repair");
      toast.error(message);
    },
  });
};
