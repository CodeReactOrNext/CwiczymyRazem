import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updatePedalboard } from "../services/arsenal.service";
import type { ArsenalUserData, PedalboardPlacement } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useUpdatePedalboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: PedalboardPlacement[]) => updatePedalboard(items),
    onMutate: (items: PedalboardPlacement[]) => {
      // Update cache directly — no re-fetch
      queryClient.setQueryData<ArsenalUserData & { fame: number }>(
        ARSENAL_QUERY_KEY,
        (prev) => prev ? { ...prev, rig: { ...prev.rig, pedalboardItems: items } } : prev
      );
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to update pedalboard";
      toast.error(message);
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
  });
};
