import type {
  RankedAction,
  WhatNextResult,
} from "feature/whatNext/types/whatNext.types";
import { describe, expect, it } from "vitest";

import { buildRoad } from "./buildRoad";

const action = (id: string): RankedAction => ({
  id,
  source: "goals",
  kind: "continue",
  isPractice: true,
  title: { key: id },
  href: "/",
  score: 1,
});

const result = (overrides: Partial<WhatNextResult> = {}): WhatNextResult => {
  const ranked = [action("a"), action("b"), action("c")];
  return {
    claims: [],
    hero: ranked[1],
    lanes: { today: [], inProgress: [], week: [], horizon: [] },
    ranked,
    ...overrides,
  };
};

describe("buildRoad", () => {
  it("starts at the next step, then follows the rank", () => {
    const road = buildRoad(result(), 10);
    expect(road.map((stop) => stop.id)).toEqual(["b", "a", "c"]);
    expect(road[0]).toMatchObject({ kind: "step", isFirst: true });
  });

  it("puts the reward chest right after the first step", () => {
    const road = buildRoad(
      result({ claims: [{ id: "x", label: { key: "x" }, href: "/" }] }),
      10,
    );
    expect(road.map((stop) => stop.id)).toEqual(["b", "chest", "a", "c"]);
  });

  it("leads with the chest when there is nothing to play", () => {
    const road = buildRoad(
      result({
        hero: null,
        ranked: [],
        claims: [{ id: "x", label: { key: "x" }, href: "/" }],
      }),
      10,
    );
    expect(road.map((stop) => stop.id)).toEqual(["chest"]);
  });

  it("cuts the road to its length", () => {
    expect(buildRoad(result(), 2)).toHaveLength(2);
  });
});
