import type { RoadmapPhase } from "../types/roadmap.types";

/**
 * The phases as they belong in the roadmap document: the content, with none
 * of one player's progress on it. The map carries sessions, ticks and
 * checkpoint results merged into the same objects it draws; those live in the
 * progress document and must not be written back into the plan.
 */
export const stripProgress = (phases: RoadmapPhase[]): RoadmapPhase[] =>
  phases.map(({ check: _check, ...phase }) => ({
    ...phase,
    steps: phase.steps.map(
      ({
        exerciseCompleted: _exercise,
        completedLessonIds: _lessons,
        songCompleted: _song,
        ...step
      }) => ({ ...step, sessionsCompleted: 0 }),
    ),
  }));
