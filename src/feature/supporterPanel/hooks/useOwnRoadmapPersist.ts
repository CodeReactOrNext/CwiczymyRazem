import { useQueryClient } from "@tanstack/react-query";
import { firebaseUpdateUserProgress } from "feature/aiCoach/services/userProgress.service";
import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";
import { newlyCompletedSteps } from "feature/aiCoach/utils/completedSteps";
import { extractStepProgress } from "feature/aiCoach/utils/roadmapProgress";
import { firebaseAddRoadmapStepLog } from "feature/logs/services/addRoadmapStepLog.service";
import type { UserRoadmapDetail } from "feature/supporterPanel/types/userRoadmaps.types";
import { displayTitle } from "feature/supporterPanel/utils/roadmapGoal";
import { useCallback, useRef } from "react";

import { userRoadmapDetailKey } from "./useUserRoadmaps";

/**
 * The map as it stood at the last save — the stored roadmap with the cached
 * sessions on its steps — so a save can tell which steps it just finished.
 */
const lastSavedPhases = (detail: UserRoadmapDetail): RoadmapPhase[] =>
  (detail.roadmap.phases ?? []).map((phase) => ({
    ...phase,
    steps: (phase.steps ?? []).map((step) => ({
      ...step,
      sessionsCompleted:
        detail.stepProgress[step.id] ?? step.sessionsCompleted ?? 0,
    })),
  }));

/**
 * Saves the signed-in player's progress on a roadmap — one they generated for
 * themselves, or somebody else's they pressed "Start this roadmap" on — the
 * write side of what `useUserRoadmapDetail` reads through the Admin SDK.
 * Every other roadmap in the "Player Roadmaps" list stays read-only.
 *
 * A step that crosses into "done" goes to the activity log under the runner,
 * the same as on the curated roadmaps in /ai-coach.
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
  // Steps already put in the activity log while this roadmap is open.
  const loggedStepsRef = useRef(new Set<string>());

  return useCallback(
    async (phases: RoadmapPhase[]) => {
      const detailKey = userRoadmapDetailKey(userId, roadmapId, runnerUid);
      const cached = queryClient.getQueryData<UserRoadmapDetail>(detailKey);
      const finished = cached
        ? newlyCompletedSteps(lastSavedPhases(cached), phases)
        : [];

      const { stepProgress, resourceProgress, phaseChecks } =
        extractStepProgress(phases);
      await firebaseUpdateUserProgress(
        runnerUid,
        roadmapId,
        stepProgress,
        resourceProgress,
        phaseChecks,
      );

      // Once per step per visit: ticking a step off, back on and off again
      // should not fill the feed with the same step.
      finished.forEach(({ step, phase }) => {
        const key = `${roadmapId}:${step.id}`;
        if (loggedStepsRef.current.has(key)) return;
        loggedStepsRef.current.add(key);
        void firebaseAddRoadmapStepLog(runnerUid, {
          roadmapId,
          roadmapTitle: cached ? displayTitle(cached.summary) : "",
          phaseTitle: phase.title,
          stepId: step.id,
          stepTitle: step.title,
        });
      });

      queryClient.setQueryData<UserRoadmapDetail>(detailKey, (prev) =>
        prev ? { ...prev, stepProgress, resourceProgress, phaseChecks } : prev,
      );
    },
    [queryClient, roadmapId, runnerUid, userId],
  );
};
