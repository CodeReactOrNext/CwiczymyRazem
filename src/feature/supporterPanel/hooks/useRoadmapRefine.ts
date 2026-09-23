import { useQueryClient } from "@tanstack/react-query";
import type {
  RefineAction,
  RefineTransport,
} from "feature/aiCoach/types/refine.types";
import { ROADMAP_REFINE_COSTS } from "feature/supporterPanel/constants/supporterPanel.constants";
import {
  SUPPORTER_ROADMAP_KEY,
  useSupporterRoadmap,
} from "feature/supporterPanel/hooks/useSupporterRoadmap";
import type { RoadmapBoard } from "feature/supporterPanel/types/supporterPanel.types";
import { useCallback, useMemo } from "react";

import { runRefineAction } from "../services/refineRoadmap.service";

/**
 * The map's way into the paid refinements, for the owner of a generated
 * roadmap: every call carries the roadmap's id, and every answer's wallet
 * lands in the banner straight away, without waiting for the board to refetch.
 */
export const useRoadmapRefine = (roadmapId: string): RefineTransport => {
  const queryClient = useQueryClient();
  const { data: board } = useSupporterRoadmap(true);

  const run = useCallback(
    async <T>(action: RefineAction, body: Record<string, unknown>) => {
      const data = await runRefineAction<T>(action, { roadmapId, ...body });
      if (data.wallet) {
        const wallet = data.wallet;
        queryClient.setQueryData<RoadmapBoard>(SUPPORTER_ROADMAP_KEY, (prev) =>
          prev ? { ...prev, wallet } : prev,
        );
      }
      return data as T;
    },
    [queryClient, roadmapId],
  );

  return useMemo(
    () => ({
      run,
      costs: ROADMAP_REFINE_COSTS,
      tokensLeft: board?.wallet.left ?? null,
    }),
    [run, board?.wallet.left],
  );
};
