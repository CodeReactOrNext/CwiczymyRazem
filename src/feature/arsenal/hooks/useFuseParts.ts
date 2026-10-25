import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFame } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppDispatch } from "store/hooks";

import {
  afterScene,
  beginScene,
  endScene,
  resolveScene,
} from "../components/Scene/sceneStore";
import { getPartLabel } from "../data/partDefinitions";
import { fuseParts } from "../services/arsenal.service";
import type { PartId, PartTier } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

interface FusePartsInput {
  partId: PartId;
  tier: PartTier;
  /** Pieces to produce — the bench bills per piece that comes out. */
  crafts: number;
}

/**
 * Reworks a stack of parts up a tier. Counts and the Fame fee live in
 * `data/fusion.ts`; the server recomputes both before anything is spent.
 */
export const useFuseParts = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ partId, tier, crafts }: FusePartsInput) =>
      fuseParts(partId, tier, crafts),
    onMutate: ({ partId, tier, crafts }) => ({
      sceneId: beginScene({ type: "rework", partId, tier, crafts }),
    }),
    onSuccess: (data, _input, scene) => {
      // Negative: the fee left the player's balance. Both wait for the scene
      // to go, so the tab re-renders off its frames and the wallet's count
      // plays where it can be seen.
      afterScene(scene?.sceneId, () => {
        dispatch(addFame(-data.fameSpent));
        queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      });
      if (scene?.sceneId != null) {
        resolveScene(scene.sceneId, data);
        return;
      }
      toast.success(
        t("toasts.reworked", {
          qty: data.produced.qty,
          part: t("labels.part_name", {
            tier: t(`labels.part_tier.${data.produced.tier}`, data.produced.tier),
            part: t(
              `labels.part.${data.produced.partId}`,
              getPartLabel(data.produced.partId),
            ),
          }),
        }),
      );
    },
    onError: (error: any, _input, scene) => {
      endScene(scene?.sceneId);
      const message = error?.response?.data?.error || t("toasts.err.rework");
      toast.error(message);
    },
  });
};
