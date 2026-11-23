import { SESSIONS_PER_WEEK } from "lib/roadmaps/generation/limits";

import type { RoadmapPhase } from "../types/roadmap.types";

/**
 * How long a roadmap takes, in weeks, at a pace a player can picture. Every
 * step says how many sessions it wants; nothing ever added them up, so a plan
 * of 260 sessions — a year — looked the same on its card as one of 60.
 */
export const estimateRoadmapWeeks = (
  phases: Pick<RoadmapPhase, "steps">[] | null | undefined,
  sessionsPerWeek = SESSIONS_PER_WEEK,
): number => {
  const sessions = (phases ?? []).reduce(
    (sum, phase) =>
      sum +
      (phase.steps ?? []).reduce(
        (inner, step) => inner + Math.max(0, step.sessionsRequired ?? 0),
        0,
      ),
    0,
  );
  return sessions > 0 ? Math.max(1, Math.ceil(sessions / sessionsPerWeek)) : 0;
};

/**
 * The return path with a note that a practice session started from a roadmap
 * step was finished — so the step ticks its exercise or song off by itself
 * and counts the session, instead of waiting for a tap. Any other return path
 * comes back unchanged.
 */
export const markStepPracticed = (
  returnTo: string | undefined,
  kind: "exercise" | "song",
): string | undefined => {
  if (!returnTo) return returnTo;
  if (!/[?&]roadmapId=/.test(returnTo) || !/[?&]step=/.test(returnTo)) {
    return returnTo;
  }
  if (/[?&]practiced=/.test(returnTo)) return returnTo;
  return `${returnTo}&practiced=${kind}`;
};
