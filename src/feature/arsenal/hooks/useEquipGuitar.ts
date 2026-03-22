import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setSelectedGuitar } from "feature/user/store/userSlice";
import { useAppDispatch } from "store/hooks";
import { toast } from "sonner";
import { equipGuitar } from "../services/arsenal.service";
import { GUITARS_BY_ID } from "../data/guitarDefinitions";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useEquipGuitar = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (guitarId: number | string) => equipGuitar(guitarId),
    onSuccess: (_data, guitarId) => {
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      const imageId = GUITARS_BY_ID.get(guitarId)?.imageId ?? guitarId;
      dispatch(setSelectedGuitar(imageId));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to equip guitar";
      toast.error(message);
    },
  });
};
