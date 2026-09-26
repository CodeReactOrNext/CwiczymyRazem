import type { UserRoadmapStepResourceProgress } from "feature/aiCoach/services/userProgress.service";
import type { PhaseCheckResult } from "feature/aiCoach/types/phaseCheck.types";
import type { Roadmap } from "feature/aiCoach/types/roadmap.types";

export interface FollowerProgressDoc {
  roadmapId: string;
  userId: string;
  stepProgress?: Record<string, number>;
  resourceProgress?: Record<string, UserRoadmapStepResourceProgress>;
  phaseChecks?: Record<string, PhaseCheckResult>;
}

export interface FollowerProgressRepair {
  stepProgress: Record<string, number>;
  phaseChecks: Record<string, PhaseCheckResult>;
  /** Step ids whose count was the owner's. */
  clearedSteps: string[];
  /** Phase ids whose checkpoint result was the owner's. */
  clearedPhases: string[];
}

const hasOwnTicks = (resources: UserRoadmapStepResourceProgress | undefined) =>
  !!resources &&
  (!!resources.exerciseCompleted ||
    !!resources.songCompleted ||
    (resources.completedLessonIds?.length ?? 0) > 0);

const sameCheck = (a: PhaseCheckResult, b: PhaseCheckResult) =>
  a.passedAt === b.passedAt &&
  a.attempts === b.attempts &&
  a.bestScore === b.bestScore &&
  a.total === b.total;

/**
 * What a follower's progress document looks like without the owner's run in
 * it. Until the map stopped falling back to the counters inside a legacy
 * roadmap document, a follower saw the owner's sessions and checkpoint results
 * on their own map, and the first save copied them into their document.
 *
 * A step's count is taken for a copy when it equals the owner's embedded count
 * and the follower has ticked nothing on that step themselves — the counts are
 * absolute (0, 1 or the full requirement), so a follower who ticked resources
 * has a count of their own even when it happens to match. A checkpoint result
 * is a copy when every field of it equals the owner's: attempts and dates do
 * not line up by chance.
 *
 * Null when there is nothing to repair: the document is the owner's own, or
 * nothing in it came from the owner.
 */
export const repairFollowerProgress = (
  roadmap: Roadmap,
  progress: FollowerProgressDoc,
): FollowerProgressRepair | null => {
  if (!roadmap.userId || progress.userId === roadmap.userId) return null;

  const stepProgress = { ...(progress.stepProgress ?? {}) };
  const phaseChecks = { ...(progress.phaseChecks ?? {}) };
  const clearedSteps: string[] = [];
  const clearedPhases: string[] = [];

  (roadmap.phases ?? []).forEach((phase) => {
    const ownerCheck = phase.check;
    const followerCheck = phaseChecks[phase.id];
    if (ownerCheck && followerCheck && sameCheck(ownerCheck, followerCheck)) {
      delete phaseChecks[phase.id];
      clearedPhases.push(phase.id);
    }

    (phase.steps ?? []).forEach((step) => {
      const ownerCount = step.sessionsCompleted;
      if (typeof ownerCount !== "number" || ownerCount <= 0) return;
      if (stepProgress[step.id] !== ownerCount) return;
      if (hasOwnTicks(progress.resourceProgress?.[step.id])) return;
      stepProgress[step.id] = 0;
      clearedSteps.push(step.id);
    });
  });

  if (!clearedSteps.length && !clearedPhases.length) return null;
  return { stepProgress, phaseChecks, clearedSteps, clearedPhases };
};
