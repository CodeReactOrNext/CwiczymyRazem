import type {
  RankedAction,
  WhatNextResult,
} from "feature/whatNext/types/whatNext.types";

export type RoadStop =
  | { kind: "step"; id: string; action: RankedAction; isFirst: boolean }
  | { kind: "chest"; id: "chest" };

/**
 * The road as stops in order: the next step first, the reward chest right
 * after it (a quick win between two steps, never the thing to start with),
 * then everything else by rank, cut to `length` stops.
 */
export const buildRoad = (
  result: WhatNextResult,
  length: number,
): RoadStop[] => {
  const steps = result.hero
    ? [
        result.hero,
        ...result.ranked.filter((action) => action.id !== result.hero!.id),
      ]
    : result.ranked;

  const stops: RoadStop[] = steps.map((action, index) => ({
    kind: "step",
    id: action.id,
    action,
    isFirst: index === 0 && !!result.hero,
  }));

  if (result.claims.length > 0)
    stops.splice(result.hero ? 1 : 0, 0, { kind: "chest", id: "chest" });

  return stops.slice(0, length);
};

/** Sideways shift of each stop on the page, in px — the road winds instead of running straight. */
const WIND = [0, 56, 84, 56, 0, -56, -84, -56];

export const windOffset = (index: number): number => WIND[index % WIND.length];
