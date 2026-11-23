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
 * Whether the step ticked off something it had not: its exercise, its song or
 * a lesson. A step already "in progress" stays at the same session count while
 * the player works through its lessons one by one, so the count alone misses
 * every tick between the first and the last.
 */
const tickedResource = (before: RoadmapStep | undefined, after: RoadmapStep) => {
  if (after.exerciseCompleted && !before?.exerciseCompleted) return true;
  if (after.songCompleted && !before?.songCompleted) return true;
  const watched = new Set(before?.completedLessonIds ?? []);
  return (after.completedLessonIds ?? []).some((id) => !watched.has(id));
};

/**
 * Whether a save moved any step forward: a session more on it, it newly done,
 * or one of its resources newly ticked off. That is "practiced a step from your
 * roadmap" for the daily quest.
 */
export const hasAdvancedStep = (
  before: RoadmapPhase[],
  after: RoadmapPhase[],
): boolean => {
  const stepsBefore = new Map(
    before.flatMap((phase) => phase.steps.map((step) => [step.id, step] as const)),
  );
  return (
    newlyCompletedSteps(before, after).length > 0 ||
    after.some((phase) =>
      phase.steps.some((step) => {
        const previous = stepsBefore.get(step.id);
        return (
          (step.sessionsCompleted ?? 0) > (previous?.sessionsCompleted ?? 0) ||
          (step.practiceSessions ?? 0) > (previous?.practiceSessions ?? 0) ||
          tickedResource(previous, step)
        );
      }),
    )
  );
};
