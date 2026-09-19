import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import type { RoadmapBranch, RoadmapTier } from "./skillRoadmap.data";

/**
 * completed — the player has anything on record for it (see hasExerciseProgress).
 * current   — the single next dot on the whole map: the first unfinished one on
 *             the first branch the player has started, or, with no progress
 *             anywhere, the very first dot of the map. Exactly one, so the
 *             marker and the "up next" card always point at the same exercise.
 * locked    — premium exercise, non-premium player.
 * available — everything else.
 */
export type RoadmapNodeState = "completed" | "current" | "available" | "locked";

export interface TierProgress {
  completed: number;
  total: number;
}

export interface RoadmapProgress {
  states: Map<string, RoadmapNodeState>;
  byTier: Map<string, TierProgress>;
  completed: number;
  total: number;
}

export const computeRoadmapProgress = (
  tiers: RoadmapTier[],
  isCompleted: (exercise: Exercise) => boolean,
  isLocked: (exercise: Exercise) => boolean,
): RoadmapProgress => {
  const states = new Map<string, RoadmapNodeState>();
  const byTier = new Map<string, TierProgress>();
  let completed = 0;
  let total = 0;
  let firstNode: Exercise | undefined;
  let currentMarked = false;

  tiers.forEach((tier) => {
    const tierProgress: TierProgress = { completed: 0, total: 0 };
    tier.branches.forEach((branch) => {
      const doneCount = branch.exercises.filter(isCompleted).length;
      branch.exercises.forEach((exercise) => {
        firstNode ??= exercise;
        tierProgress.total += 1;
        if (isCompleted(exercise)) {
          tierProgress.completed += 1;
          states.set(exercise.id, "completed");
          return;
        }
        if (isLocked(exercise)) {
          states.set(exercise.id, "locked");
          return;
        }
        if (doneCount > 0 && !currentMarked) {
          currentMarked = true;
          states.set(exercise.id, "current");
          return;
        }
        states.set(exercise.id, "available");
      });
    });
    byTier.set(tier.id, tierProgress);
    completed += tierProgress.completed;
    total += tierProgress.total;
  });

  // A blank map still needs a place to start.
  if (
    completed === 0 &&
    firstNode &&
    states.get(firstNode.id) === "available"
  ) {
    states.set(firstNode.id, "current");
  }

  return { states, byTier, completed, total };
};

export interface RoadmapPlacement {
  exercise: Exercise;
  branch: RoadmapBranch;
  tier: RoadmapTier;
}

/**
 * Where the one "current" exercise sits, named the way a player would say it:
 * the exercise, the branch it belongs to and the tier that branch hangs off.
 */
export const findCurrentPlacement = (
  tiers: RoadmapTier[],
  states: Map<string, RoadmapNodeState>,
): RoadmapPlacement | null => {
  for (const tier of tiers) {
    for (const branch of tier.branches) {
      const exercise = branch.exercises.find(
        (candidate) => states.get(candidate.id) === "current",
      );
      if (exercise) return { exercise, branch, tier };
    }
  }
  return null;
};
