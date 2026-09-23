import {
  ROADMAP_ADD_STEPS_MAX,
  ROADMAP_REFINE_COSTS,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { describe, expect, it } from "vitest";

import { clampAddCount, isRefineAction, refineCost } from "./refine";

describe("refine actions", () => {
  it("knows its own actions and nothing else", () => {
    expect(isRefineAction("rewriteStep")).toBe(true);
    expect(isRefineAction("addSteps")).toBe(true);
    expect(isRefineAction("deleteRoadmap")).toBe(false);
    expect(isRefineAction(undefined)).toBe(false);
  });

  it("prices per call, except adding steps which is per step", () => {
    expect(refineCost("rewriteStep")).toBe(ROADMAP_REFINE_COSTS.rewriteStep);
    expect(refineCost("findSong")).toBe(ROADMAP_REFINE_COSTS.findSong);
    expect(refineCost("addSteps", 1)).toBe(ROADMAP_REFINE_COSTS.addStep);
    expect(refineCost("addSteps", 2)).toBe(ROADMAP_REFINE_COSTS.addStep * 2);
  });

  it("never adds fewer than one step or more than the cap", () => {
    expect(clampAddCount(0)).toBe(1);
    expect(clampAddCount(-3)).toBe(1);
    expect(clampAddCount("x")).toBe(1);
    expect(clampAddCount(99)).toBe(ROADMAP_ADD_STEPS_MAX);
    expect(refineCost("addSteps", 99)).toBe(
      ROADMAP_REFINE_COSTS.addStep * ROADMAP_ADD_STEPS_MAX,
    );
  });

  it("charges something for every action — nothing here is free", () => {
    (
      [
        "rewriteStep",
        "swapExercise",
        "refreshLessons",
        "findSong",
        "addSteps",
      ] as const
    ).forEach((action) => expect(refineCost(action)).toBeGreaterThan(0));
  });
});
