import type {
  JourneyModule,
  JourneyModuleWithStatus,
  JourneyProgressDocument,
  JourneyStep,
  JourneyStepProgress,
  JourneyStepWithStatus,
} from "feature/journey/types/journey.types";

/**
 * A step's status from what the player has saved.
 *
 * Started-but-unfinished is "in-progress", the first step is always open, and
 * any other step opens once the one before it is completed.
 */
export const mergeStepsWithProgress = (
  steps: JourneyStep[],
  savedSteps: Record<string, JourneyStepProgress> | undefined
): JourneyStepWithStatus[] =>
  steps.map((step) => {
    const saved = savedSteps?.[step.id];

    if (saved?.completed) return { ...step, status: "completed", stars: saved.stars };
    if (saved?.startedAt && !saved.completed) return { ...step, status: "in-progress" };
    if (step.order === 1) return { ...step, status: "available" };

    const prev = steps.find((s) => s.order === step.order - 1);
    if (prev && savedSteps?.[prev.id]?.completed) return { ...step, status: "available" };

    return { ...step, status: "locked" };
  });

export const buildModuleWithStatus = (
  module: JourneyModule,
  progressDoc: JourneyProgressDocument | null
): JourneyModuleWithStatus => {
  const savedModule = progressDoc?.moduleProgress?.[module.id];
  const allSteps = module.stages.flatMap((s) => s.steps);
  const stepsWithStatus = mergeStepsWithProgress(allSteps, savedModule?.steps);

  const stages = module.stages.map((stage) => ({
    ...stage,
    steps: stepsWithStatus.filter((s) => s.stageId === stage.id),
  }));

  const completedCount = stepsWithStatus.filter((s) => s.status === "completed").length;

  return {
    ...module,
    stages,
    completedCount,
    totalCount: allSteps.length,
  };
};

export interface NextJourneyStep {
  module: JourneyModuleWithStatus;
  step: JourneyStepWithStatus;
}

const moduleSteps = (module: JourneyModuleWithStatus) =>
  module.stages.flatMap((stage) => stage.steps);

/**
 * The one Journey step the player should do next, across every module.
 *
 * A step already started wins, wherever it is. Otherwise the open step of a
 * module the player has begun, so a half-walked path is finished before a new
 * one is opened. Only then the first open step of the first module, which is
 * where a player who has never touched Journey starts. Locked modules and
 * finished modules are skipped; null when nothing is left.
 */
export const getNextJourneyStep = (
  modules: JourneyModuleWithStatus[]
): NextJourneyStep | null => {
  const open = modules.filter((m) => !m.locked && m.completedCount < m.totalCount);

  for (const mod of open) {
    const step = moduleSteps(mod).find((s) => s.status === "in-progress");
    if (step) return { module: mod, step };
  }

  const pick = (candidates: JourneyModuleWithStatus[]) => {
    for (const mod of candidates) {
      const step = moduleSteps(mod).find((s) => s.status === "available");
      if (step) return { module: mod, step };
    }
    return null;
  };

  return pick(open.filter((m) => m.completedCount > 0)) ?? pick(open);
};
