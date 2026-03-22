import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { setSelectedGuitar } from "feature/user/store/userSlice";
import { updateRig } from "../services/arsenal.service";
import type { RigSetup } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

interface UpdateRigPayload {
  rig: RigSetup;
  selectedGuitar?: string | number | null;
}

export const useUpdateRig = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ rig, selectedGuitar }: UpdateRigPayload) => updateRig(rig, selectedGuitar),
    onSuccess: (_, { selectedGuitar }) => {
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      if (selectedGuitar !== undefined) {
        dispatch(setSelectedGuitar(selectedGuitar ?? null));
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to update rig";
      toast.error(message);
    },
  });
};
