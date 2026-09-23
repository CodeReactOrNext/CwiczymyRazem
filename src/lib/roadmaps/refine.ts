import type {
  RefineAction,
  RefineCosts,
} from "feature/aiCoach/types/refine.types";
import {
  ROADMAP_ADD_STEPS_MAX,
  ROADMAP_REFINE_COSTS,
} from "feature/supporterPanel/constants/supporterPanel.constants";

const ACTIONS: readonly RefineAction[] = [
  "rewriteStep",
  "swapExercise",
  "refreshLessons",
  "findSong",
  "addSteps",
];

export const isRefineAction = (value: unknown): value is RefineAction =>
  ACTIONS.includes(value as RefineAction);

/** How many steps one "add steps" call may add: at least one, never more than the cap. */
export const clampAddCount = (value: unknown): number => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(ROADMAP_ADD_STEPS_MAX, Math.max(1, n));
};

/**
 * What one refinement costs, from the same table the buttons print. The
 * server prices from here and nowhere else, so what the card says a button
 * costs is what the wallet is charged.
 */
export const refineCost = (
  action: RefineAction,
  count = 1,
  costs: RefineCosts = ROADMAP_REFINE_COSTS,
): number =>
  action === "addSteps" ? costs.addStep * clampAddCount(count) : costs[action];
