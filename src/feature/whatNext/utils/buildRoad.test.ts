import type { FeatureGoal } from "feature/whatNext/data/featureGoals";
import type {
  RankedAction,
  WhatNextResult,
} from "feature/whatNext/types/whatNext.types";
import { describe, expect, it } from "vitest";

import { buildRoad, ROAD_STOPS, withoutSnoozedGoals } from "./buildRoad";

const action = (id: string): RankedAction => ({
  id,
  source: "goals",
  kind: "continue",
  isPractice: true,
  title: { key: id },
  href: "/",
  score: 1,
});

const goal = (id: FeatureGoal["id"]): FeatureGoal => ({ id, href: `/${id}` });

const result = (overrides: Partial<WhatNextResult> = {}): WhatNextResult => {
  const ranked = [action("a"), action("b"), action("c")];
  return {
    hero: ranked[1],
    perks: [],
    lanes: { today: [], inProgress: [], week: [], horizon: [] },
    ranked,
    ...overrides,
  };
};

const ids = (stops: { id: string }[]) => stops.map((stop) => stop.id);

describe("buildRoad", () => {
  it("is three stops long", () => {
    expect(ROAD_STOPS).toBe(3);
    expect(buildRoad(result(), [goal("boss"), goal("rig")])).toHaveLength(3);
  });

  it("starts at the hero, then a feature to try", () => {
    const road = buildRoad(result(), [goal("tempo_goal")]);
    expect(ids(road)).toEqual(["b", "goal:tempo_goal", "a"]);
    expect(road[0]).toMatchObject({ kind: "step", isFirst: true });
  });

  it("alternates features to try with ranked actions", () => {
    const road = buildRoad(result(), [goal("tempo_goal"), goal("boss")]);
    expect(ids(road)).toEqual(["b", "goal:tempo_goal", "a"]);
  });

  it("leaves out a goal that leads where a step on the road already goes", () => {
    const plan = { ...action("b"), href: "/timer/plans?planId=p1" };
    const road = buildRoad(
      result({ hero: plan, ranked: [action("a"), plan] }),
      [{ id: "practice_plan", href: "/timer/plans" }, goal("boss")],
    );
    expect(ids(road)).toEqual(["b", "goal:boss", "a"]);
  });

  it("fills with ranked actions once every feature is tried", () => {
    expect(ids(buildRoad(result(), []))).toEqual(["b", "a", "c"]);
  });

  it("does not repeat the first session as a goal when it is the hero", () => {
    const first = { ...action("onboarding:first-session") };
    const road = buildRoad(
      result({ hero: first, ranked: [first] }),
      [goal("first_session"), goal("first_guitar")],
    );
    expect(ids(road)).toEqual(["onboarding:first-session", "goal:first_guitar"]);
  });

  it("is empty when there is nothing to play or try", () => {
    expect(buildRoad(result({ hero: null, ranked: [] }), [])).toEqual([]);
  });
});

describe("withoutSnoozedGoals", () => {
  it("hides a goal for the week it was waved away", () => {
    const goals = [goal("boss"), goal("rig")];
    const snoozed = { "goal:boss": 2_000 };
    expect(withoutSnoozedGoals(goals, snoozed, 1_000)).toEqual([goal("rig")]);
    expect(withoutSnoozedGoals(goals, snoozed, 3_000)).toEqual(goals);
  });
});
