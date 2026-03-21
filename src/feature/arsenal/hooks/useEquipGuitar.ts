import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfileCustomization } from "feature/user/store/userSlice.asyncThunk";
import { useAppDispatch } from "store/hooks";
import { toast } from "sonner";
import { equipGuitar } from "../services/arsenal.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useEquipGuitar = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (guitarId: number | string) => equipGuitar(guitarId),
    onSuccess: (_data, guitarId) => {
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      dispatch(updateProfileCustomization({ selectedGuitar: guitarId }));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to equip guitar";
      toast.error(message);
    },
  });
};
