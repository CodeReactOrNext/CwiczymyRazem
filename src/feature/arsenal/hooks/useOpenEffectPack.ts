import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { openEffectPack } from "../services/arsenal.service";
import type { OpenEffectPackResult } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useOpenEffectPack = () => {
  const queryClient = useQueryClient();

  return useMutation<OpenEffectPackResult>({
    mutationFn: () => openEffectPack(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to open effect pack";
      toast.error(message);
    },
  });
};
