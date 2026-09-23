import { useQueryClient } from "@tanstack/react-query";
import { firebaseUpdateUserProgress } from "feature/aiCoach/services/userProgress.service";
import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";
import { extractStepProgress } from "feature/aiCoach/utils/roadmapProgress";
import type { UserRoadmapDetail } from "feature/supporterPanel/types/userRoadmaps.types";
import { useCallback } from "react";

import { userRoadmapDetailKey } from "./useUserRoadmaps";

/**
 * Saves the signed-in player's progress on a roadmap — one they generated for
 * themselves, or somebody else's they pressed "Start this roadmap" on — the
 * write side of what `useUserRoadmapDetail` reads through the Admin SDK.
 * Every other roadmap in the "Player Roadmaps" list stays read-only.
 *
 * `userId` is the roadmap's owner; `runnerUid` is whose progress it is, the
 * owner unless given.
 */
export const useOwnRoadmapPersist = (
  userId: string,
  roadmapId: string,
  runnerUid: string = userId,
) => {
  const queryClient = useQueryClient();

  return useCallback(
    async (phases: RoadmapPhase[]) => {
      const { stepProgress, resourceProgress, phaseChecks } =
        extractStepProgress(phases);
      await firebaseUpdateUserProgress(
        runnerUid,
        roadmapId,
        stepProgress,
        resourceProgress,
        phaseChecks,
      );

      queryClient.setQueryData<UserRoadmapDetail>(
        userRoadmapDetailKey(userId, roadmapId, runnerUid),
        (prev) => (prev ? { ...prev, stepProgress, phaseChecks } : prev),
      );
    },
    [queryClient, roadmapId, runnerUid, userId],
  );
};
