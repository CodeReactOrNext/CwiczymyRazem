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
  selectedGuitarYear?: number;
  selectedGuitarCountry?: string;
}

export const useUpdateRig = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ rig, selectedGuitar, selectedGuitarYear, selectedGuitarCountry }: UpdateRigPayload) =>
      updateRig(rig, selectedGuitar, selectedGuitarYear, selectedGuitarCountry),
    onSuccess: (_, { selectedGuitar, selectedGuitarYear, selectedGuitarCountry }) => {
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      if (selectedGuitar !== undefined) {
        dispatch(setSelectedGuitar({ imageId: selectedGuitar ?? null, year: selectedGuitarYear, country: selectedGuitarCountry }));
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to update rig";
      toast.error(message);
    },
  });
};
