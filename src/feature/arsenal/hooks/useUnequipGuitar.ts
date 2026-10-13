import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setSelectedGuitar } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import { unequipGuitar } from "../services/arsenal.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useUnequipGuitar = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: () => unequipGuitar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      dispatch(setSelectedGuitar({ imageId: null }));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || t("toasts.err.unequip");
      toast.error(message);
    },
  });
};
