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
import { subjectFromCache } from "../components/Scene/sceneSubject";
import { buildItem } from "../services/arsenal.service";
import type { WorkshopKind } from "../types/arsenal.types";
import { ARSENAL_QUERY_KEY } from "./useArsenalData";

/** Buys one build level. The bill is recomputed server-side from the stored item. */
export const useWorkshopBuild = () => {
  const { t } = useTranslation("arsenal");
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ itemId, kind }: { itemId: string; kind: WorkshopKind }) =>
      buildItem(itemId, kind),
    // The bench works on it on screen: the hammer while the request is out,
    // the level — and a promotion, when this build is one — once it lands.
    onMutate: ({ itemId, kind }) => {
      const subject = subjectFromCache(queryClient, kind, itemId);
      return {
        sceneId: subject ? beginScene({ type: "build", subject }) : null,
      };
    },
    onSuccess: (data, _vars, scene) => {
      // Fame lives in the Redux user slice, not in this query — without the
      // mirror both the header counter and the build's own Fame gate keep
      // quoting the pre-build balance until the page is reloaded. Both it and
      // the refetch re-render the tab underneath, so they wait for the scene.
      afterScene(scene?.sceneId, () => {
        dispatch(deductFame(data.fameSpent ?? 0));
        queryClient.invalidateQueries({ queryKey: ARSENAL_QUERY_KEY });
      });
      if (scene?.sceneId != null) {
        resolveScene(scene.sceneId, data);
        return;
      }
      toast.success(t("toasts.build_done", { build: data.buildLevel, gain: data.levelGain }));
    },
    onError: (error: unknown, _vars, scene) => {
      endScene(scene?.sceneId);
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || t("toasts.err.build");
      toast.error(message);
    },
  });
};
