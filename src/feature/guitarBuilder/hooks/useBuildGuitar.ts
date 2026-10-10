import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { setFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { buildGuitar, renameGuitar } from "../services/buildGuitar.service";

export const useBuildGuitar = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: buildGuitar,
    onSuccess: (result) => {
      dispatch(setFame(result.newFame));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Couldn't build the guitar";
      toast.error(message);
    },
  });
};

export const useRenameGuitar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: renameGuitar,
    onSuccess: () => {
      toast.success("Renamed");
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Couldn't rename the guitar";
      toast.error(message);
    },
  });
};
