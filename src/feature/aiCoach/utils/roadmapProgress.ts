import type { PhaseCheckResult } from "feature/aiCoach/types/phaseCheck.types";
import type { RoadmapPhase } from "feature/aiCoach/types/roadmap.types";

import type { UserRoadmapStepResourceProgress } from "../services/userProgress.service";
import { extractPhaseChecks } from "./phaseCheck";

export interface StepProgressSnapshot {
  stepProgress: Record<string, number>;
  resourceProgress: Record<string, UserRoadmapStepResourceProgress>;
  /** Checkpoint results, only for the phases that have sat one. */
  phaseChecks: Record<string, PhaseCheckResult>;
}

/**
 * What `firebaseUpdateUserProgress` needs, pulled off a roadmap's live phases
 * — the shape `RoadmapView`'s `onPersist` hands back on every step change.
 * Shared by the curated-roadmap view and by a player's own generated one, so
 * the two save progress exactly the same way.
 */
export const extractStepProgress = (
  phases: RoadmapPhase[],
): StepProgressSnapshot => {
  const stepProgress: Record<string, number> = {};
  const resourceProgress: Record<string, UserRoadmapStepResourceProgress> = {};

  phases.forEach((phase) =>
    phase.steps.forEach((step) => {
      stepProgress[step.id] = step.sessionsCompleted;
      resourceProgress[step.id] = {
        exerciseCompleted: step.exerciseCompleted,
        completedLessonIds: step.completedLessonIds,
        songCompleted: step.songCompleted,
      };
    }),
  );

  return {
    stepProgress,
    resourceProgress,
    phaseChecks: extractPhaseChecks(phases),
  };
};
