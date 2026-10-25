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
import { subjectOfDef } from "../components/Scene/sceneSubject";
import { EFFECTS_BY_ID } from "../data/effectDefinitions";
import { GUITARS_BY_ID } from "../data/guitarDefinitions";
import { commissionItem } from "../services/arsenal.service";
import type { WorkshopKind } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/**
 * Orders a model from the bench. The price and every eligibility rule are
 * recomputed server-side from the stored account.
 */
export const useWorkshopCommission = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({
      kind,
      definitionId,
    }: {
      kind: WorkshopKind;
      definitionId: number | string;
    }) => commissionItem(kind, definitionId),
    // The bench builds it on screen: the order opens the delivery scene, which
    // turns the card over once the server has minted it.
    onMutate: ({ kind, definitionId }) => {
      const def =
        kind === "guitar"
          ? GUITARS_BY_ID.get(definitionId)
          : EFFECTS_BY_ID.get(definitionId);
      return {
        sceneId: def
          ? beginScene({
              type: "delivery",
              source: "commission",
              subject: subjectOfDef(kind, def),
            })
          : null,
      };
    },
    onSuccess: (data, _vars, scene) => {
      resolveScene(scene?.sceneId, data);
      // Fame lives in the Redux user slice, not in this query — mirrored so
      // the header counter and the next quote stop showing the old balance.
      // Both wait for the delivery scene to go, off the frames it plays on.
      afterScene(scene?.sceneId, () => {
        dispatch(deductFame(data.fameSpent ?? 0));
        queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      });
    },
    onError: (error: unknown, _vars, scene) => {
      endScene(scene?.sceneId);
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || t("toasts.err.commission");
      toast.error(message);
    },
  });
};
