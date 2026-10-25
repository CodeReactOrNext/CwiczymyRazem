import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deductFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import {
  afterScene,
  beginScene,
  endScene,
  resolveScene,
} from "../components/Scene/sceneStore";
import type { SceneSubject } from "../components/Scene/sceneSubject";
import type { BuyTraderOfferInput } from "../services/trader.service";
import { buyTraderOffer } from "../services/trader.service";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

export const useBuyTraderOffer = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (
      input: BuyTraderOfferInput & {
        /** An instrument to draw while the purchase is out — gear only. */
        subject?: SceneSubject;
      },
    ) => buyTraderOffer(input),
    onMutate: ({ subject }) => ({
      sceneId: subject
        ? beginScene({ type: "delivery", source: "trader", subject })
        : null,
    }),
    onSuccess: (result, _input, scene) => {
      resolveScene(scene?.sceneId, result);
      // Deducted after the fact, from what the server actually charged — the
      // price depends on the window's stock, which the client must not assume.
      // An instrument's delivery scene holds both until it has gone.
      afterScene(scene?.sceneId, () => {
        dispatch(deductFame(result.spent));
        queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      });

      // Parts and instruments land where the player can see them; a mod lands in
      // the stash, a tab away, so it is the one purchase that has to say so.
      if (result.kind === "mod") {
        toast.success(t("toasts.mod_added"));
      }
    },
    onError: (error: any, _input, scene) => {
      endScene(scene?.sceneId);
      toast.error(error?.response?.data?.error || t("toasts.err.purchase"));
    },
  });
};
