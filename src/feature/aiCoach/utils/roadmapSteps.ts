import type { RoadmapPhase, RoadmapStep } from "../types/roadmap.types";
import { getStepStatus } from "./stepStatus";

/** One step with everything the drawer needs to place it on the roadmap. */
export interface RoadmapStepRef {
  step: RoadmapStep;
  phase: RoadmapPhase;
  /** Position within its phase, 0-based. */
  stepIdx: number;
  phaseIdx: number;
  /** Position along the whole roadmap, 0-based — what prev/next walk. */
  index: number;
}

/** Every step in path order, phase by phase. */
export const flattenRoadmapSteps = (
  phases: RoadmapPhase[],
): RoadmapStepRef[] => {
  const refs: RoadmapStepRef[] = [];
  phases.forEach((phase, phaseIdx) => {
    phase.steps.forEach((step, stepIdx) => {
      refs.push({ step, phase, stepIdx, phaseIdx, index: refs.length });
    });
  });
  return refs;
};

export const findRoadmapStep = (
  steps: RoadmapStepRef[],
  stepId: string | null | undefined,
): RoadmapStepRef | null =>
  stepId ? (steps.find((ref) => ref.step.id === stepId) ?? null) : null;

/**
 * Where "Continue" should land: the step already in progress if there is one,
 * otherwise the first step not done yet. Null once the whole roadmap is done.
 */
export const getNextUnfinishedStep = (
  steps: RoadmapStepRef[],
): RoadmapStepRef | null =>
  steps.find((ref) => getStepStatus(ref.step) === "in-progress") ??
  steps.find((ref) => getStepStatus(ref.step) !== "done") ??
  null;
