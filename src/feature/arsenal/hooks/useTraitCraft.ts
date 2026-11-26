import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { addFame, setFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { playUiSound } from "lib/uiSounds/uiSounds";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import {
  extractTrait,
  insertTrait,
  sellTraitItem,
} from "../services/traitCraft.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

const serverMessage = (error: unknown): string | undefined =>
  isAxiosError(error)
    ? (error.response?.data as { error?: string } | undefined)?.error
    : undefined;

/** Lifts a trait off an instrument into an imprint, spending one extractor. */
export const useExtractTrait = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: extractTrait,
    onSuccess: () => {
      playUiSound("reward");
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(serverMessage(error) ?? t("trait_craft.err.extract"));
    },
  });
};

/** Puts an imprint into an instrument for Fame. */
export const useInsertTrait = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: insertTrait,
    onSuccess: (data) => {
      dispatch(setFame(data.newFame));
      playUiSound("levelUp");
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(serverMessage(error) ?? t("trait_craft.err.insert"));
    },
  });
};

/** Sells an extractor or an imprint to the bin. */
export const useSellTraitItem = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: sellTraitItem,
    onSuccess: (data) => {
      dispatch(addFame(data.fameReward));
      playUiSound("reward");
      toast.success(t("toasts.sold_for", { fame: data.fameReward }));
      queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(serverMessage(error) ?? t("trait_craft.err.sell"));
    },
  });
};
