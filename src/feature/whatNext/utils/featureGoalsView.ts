import { isFeatureUnlocked } from "feature/levelGate/data/featureUnlocks";
import type {
  FeatureGoal,
  FeatureGoalId,
} from "feature/whatNext/data/featureGoals";
import { FEATURE_GOALS } from "feature/whatNext/data/featureGoals";

export interface FeatureGoalStatus {
  id: FeatureGoalId;
  done: boolean;
}

/**
 * The goals still to do at the player's level, in priority order: what the
 * road can send the player to next. Done goals and goals behind a level the
 * player has not reached are left out.
 */
export const pendingFeatureGoals = (
  statuses: FeatureGoalStatus[],
  lvl: number,
): FeatureGoal[] => {
  const done = new Set(
    statuses.filter((status) => status.done).map((status) => status.id),
  );
  return FEATURE_GOALS.filter(
    (goal) =>
      !done.has(goal.id) &&
      (!goal.unlock || isFeatureUnlocked(goal.unlock, lvl)),
  );
};
