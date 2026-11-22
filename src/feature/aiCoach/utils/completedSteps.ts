import type { RoadmapPhase, RoadmapStep } from "../types/roadmap.types";
import { getStepStatus } from "./stepStatus";

export interface CompletedStep {
  step: RoadmapStep;
  phase: RoadmapPhase;
}

/**
 * The steps a save just finished: done after it, not done before it. A step
 * that was already done, or that went back to not done, is not news — only
 * the moment a step crosses into "done" goes to the activity log.
 */
export const newlyCompletedSteps = (
  before: RoadmapPhase[],
  after: RoadmapPhase[],
): CompletedStep[] => {
  const wasDone = new Set(
    before.flatMap((phase) =>
      phase.steps
        .filter((step) => getStepStatus(step) === "done")
        .map((step) => step.id),
    ),
  );

  return after.flatMap((phase) =>
    phase.steps
      .filter((step) => getStepStatus(step) === "done" && !wasDone.has(step.id))
      .map((step) => ({ step, phase })),
  );
};

/**
 * Whether a save moved any step forward: a session more on it, or it newly
 * done. That is "practiced a step from your roadmap" for the daily quest.
 */
export const hasAdvancedStep = (
  before: RoadmapPhase[],
  after: RoadmapPhase[],
): boolean => {
  const sessionsBefore = new Map(
    before.flatMap((phase) =>
      phase.steps.map((step) => [step.id, step.sessionsCompleted ?? 0] as const),
    ),
  );
  return (
    newlyCompletedSteps(before, after).length > 0 ||
    after.some((phase) =>
      phase.steps.some(
        (step) => (step.sessionsCompleted ?? 0) > (sessionsBefore.get(step.id) ?? 0),
      ),
    )
  );
};
