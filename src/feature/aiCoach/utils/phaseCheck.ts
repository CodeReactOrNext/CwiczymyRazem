import type { PhaseCheckResult } from "../types/phaseCheck.types";
import type { RoadmapPhase } from "../types/roadmap.types";
import { getStepStatus } from "./stepStatus";

/** Questions on every checkpoint, and how many of them have to be right. */
export const PHASE_CHECK_QUESTIONS = 6;
export const PHASE_CHECK_PASS_MARK = 5;

/**
 * Where a phase's checkpoint stands.
 *
 * - `locked`: steps of the phase still open; the quiz waits for them.
 * - `ready`: every step done, the quiz not passed yet.
 * - `passed`: the quiz was passed at least once.
 */
export type PhaseCheckState = "locked" | "ready" | "passed";

export const isPhasePassed = (phase: RoadmapPhase): boolean =>
  !!phase.check?.passedAt;

export const areStepsDone = (phase: RoadmapPhase): boolean =>
  phase.steps.length > 0 &&
  phase.steps.every((step) => getStepStatus(step) === "done");

export const getPhaseCheckState = (phase: RoadmapPhase): PhaseCheckState => {
  if (isPhasePassed(phase)) return "passed";
  return areStepsDone(phase) ? "ready" : "locked";
};

/** A phase counts as cleared only once its steps are done and its checkpoint passed. */
export const isPhaseCleared = (phase: RoadmapPhase): boolean =>
  areStepsDone(phase) && isPhasePassed(phase);

/**
 * The first checkpoint the player can sit right now — the phase they just
 * finished, before the next phase's first step. Null when there is none.
 */
export const getNextCheckpoint = (
  phases: RoadmapPhase[],
): { phase: RoadmapPhase; phaseIdx: number } | null => {
  const phaseIdx = phases.findIndex(
    (phase) => getPhaseCheckState(phase) === "ready",
  );
  return phaseIdx === -1 ? null : { phase: phases[phaseIdx], phaseIdx };
};

export const countPassedCheckpoints = (phases: RoadmapPhase[]): number =>
  phases.filter(isPhasePassed).length;

export const isPassingScore = (score: number, total: number): boolean =>
  total > 0 && score >= Math.min(total, PHASE_CHECK_PASS_MARK);

/**
 * The phase's result after one more attempt. A pass is permanent: a later
 * failed retake never takes it away, it only counts as another attempt.
 */
export const withCheckAttempt = (
  phase: RoadmapPhase,
  score: number,
  total: number,
  now: string = new Date().toISOString(),
): RoadmapPhase => {
  const previous: PhaseCheckResult = phase.check ?? {
    passedAt: null,
    attempts: 0,
    bestScore: 0,
    total,
  };
  const passed = isPassingScore(score, total);
  return {
    ...phase,
    check: {
      passedAt: previous.passedAt ?? (passed ? now : null),
      attempts: previous.attempts + 1,
      bestScore: Math.max(previous.bestScore, score),
      total,
    },
  };
};

/** The stored results, keyed by phase id — what the progress document keeps. */
export const extractPhaseChecks = (
  phases: RoadmapPhase[],
): Record<string, PhaseCheckResult> => {
  const checks: Record<string, PhaseCheckResult> = {};
  phases.forEach((phase) => {
    if (phase.check) checks[phase.id] = phase.check;
  });
  return checks;
};

/** Puts stored results back onto the phases they belong to. */
export const withPhaseChecks = (
  phases: RoadmapPhase[],
  phaseChecks: Record<string, PhaseCheckResult> | null | undefined,
): RoadmapPhase[] =>
  phases.map((phase) => {
    const check = phaseChecks?.[phase.id];
    return check ? { ...phase, check } : phase;
  });

/** True when every phase's checkpoint in `phaseChecks` has been passed. */
export const allCheckpointsPassed = (
  phaseIds: string[],
  phaseChecks: Record<string, PhaseCheckResult> | null | undefined,
): boolean =>
  phaseIds.length > 0 &&
  phaseIds.every((phaseId) => !!phaseChecks?.[phaseId]?.passedAt);
