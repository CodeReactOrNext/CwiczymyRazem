import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ARSENAL_QUERY_KEY } from "feature/arsenal/hooks/useArsenalData";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { setFame } from "feature/user/store/userSlice";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { buildGuitar, renameGuitar } from "../services/buildGuitar.service";

export const useBuildGuitar = () => {
  const labels = useArsenalLabels();
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
          ?.error ?? labels.t("builder.err_build");
      toast.error(labels.builderError(message));
    },
  });
};

export const useRenameGuitar = () => {
  const labels = useArsenalLabels();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: renameGuitar,
    onSuccess: () => {
      toast.success(labels.t("builder.renamed"));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? labels.t("builder.err_rename");
      toast.error(message);
    },
  });
};
