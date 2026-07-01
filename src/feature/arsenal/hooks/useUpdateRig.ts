import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setSelectedGuitar } from "feature/user/store/userSlice";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { memoryCache } from "utils/cache/memoryCache";

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
      // Rig changed → gear leaderboard caches are stale
      memoryCache.clear("leaderboard:gear");
      memoryCache.clear("userRank:gear");
      queryClient.invalidateQueries({ queryKey: ["userGearLevel"] });
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
