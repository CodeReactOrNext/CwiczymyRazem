import type { FeatureGoal } from "feature/whatNext/data/featureGoals";
import type {
  RankedAction,
  WhatNextResult,
} from "feature/whatNext/types/whatNext.types";

/** Stops on the road at a time. More than this and "next" turns into a list. */
export const ROAD_STOPS = 3;

/** A brand-new player's hero is the first session, which is also goal one. */
const FIRST_SESSION_HERO = "onboarding:first-session";

/** The id a goal's stop goes by — also the key it is snoozed under. */
export const goalStopId = (goalId: string) => `goal:${goalId}`;

/** Goals not waved away with "Not this week", or whose week is over. */
export const withoutSnoozedGoals = (
  goals: FeatureGoal[],
  snoozed: Record<string, number>,
  now: number = Date.now(),
): FeatureGoal[] =>
  goals.filter((goal) => !((snoozed[goalStopId(goal.id)] ?? 0) > now));

/** A link's page, without its query: "/timer/plans?planId=x" is "/timer/plans". */
const pageOf = (href: string | null | undefined) => href?.split(/[?#]/)[0];

export type RoadStop =
  | { kind: "step"; id: string; action: RankedAction; isFirst: boolean }
  | { kind: "goal"; id: string; goal: FeatureGoal };

/**
 * The road, three stops long, in the order they matter:
 *
 * 1. the player's own practice (the hero, with the streak and quest riding on it),
 * 2. then, turn about, the next feature the player has not tried yet and the
 *    next ranked action, until the road is full.
 *
 * Alternating keeps a new player discovering the app without burying the
 * practice of someone who already knows it.
 */
export const buildRoad = (
  result: WhatNextResult,
  pendingGoals: FeatureGoal[],
  length: number = ROAD_STOPS,
): RoadStop[] => {
  const steps = result.hero
    ? [
        result.hero,
        ...result.ranked.filter((action) => action.id !== result.hero!.id),
      ]
    : result.ranked;
  // A goal that leads where a step on the road already goes reads as the same
  // stop twice ("play a plan" next to the plan being played); the step wins.
  const stepPages = new Set(steps.slice(0, length).map((s) => pageOf(s.href)));
  const goals = pendingGoals.filter(
    (goal) =>
      !(goal.id === "first_session" && result.hero?.id === FIRST_SESSION_HERO) &&
      !stepPages.has(pageOf(goal.href)),
  );

  const stops: RoadStop[] = [];
  let step = 0;
  let goal = 0;

  if (steps[0]) {
    stops.push({
      kind: "step",
      id: steps[0].id,
      action: steps[0],
      isFirst: !!result.hero,
    });
    step = 1;
  }

  let goalTurn = true;
  while (stops.length < length && (goal < goals.length || step < steps.length)) {
    if ((goalTurn || step >= steps.length) && goal < goals.length) {
      const next = goals[goal++];
      stops.push({ kind: "goal", id: goalStopId(next.id), goal: next });
    } else if (step < steps.length) {
      const next = steps[step++];
      stops.push({ kind: "step", id: next.id, action: next, isFirst: false });
    }
    goalTurn = !goalTurn;
  }

  return stops.slice(0, length);
};
