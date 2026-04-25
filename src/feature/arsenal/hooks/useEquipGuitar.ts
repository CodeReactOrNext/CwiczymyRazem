import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setSelectedGuitar } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { GUITARS_BY_ID } from "../data/guitarDefinitions";
import { equipGuitar } from "../services/arsenal.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

interface EquipGuitarPayload {
  guitarId: number | string;
  year?: number;
  country?: string;
}

export const useEquipGuitar = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ guitarId }: EquipGuitarPayload) => equipGuitar(guitarId),
    onSuccess: (_data, { guitarId, year, country }) => {
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      const imageId = GUITARS_BY_ID.get(guitarId)?.imageId ?? guitarId;
      dispatch(setSelectedGuitar({ imageId, year, country }));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to equip guitar";
      toast.error(message);
    },
  });
};
