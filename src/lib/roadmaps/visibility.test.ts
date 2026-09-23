import {
  ROADMAP_GENERATION_COST,
  ROADMAP_PRIVATE_GENERATION_COST,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { describe, expect, it } from "vitest";

import {
  isRoadmapVisibility,
  isRoadmapVisibleTo,
  roadmapGenerationCost,
  visibilityOf,
} from "./visibility";

describe("roadmap visibility", () => {
  it("knows the two values and nothing else", () => {
    expect(isRoadmapVisibility("public")).toBe(true);
    expect(isRoadmapVisibility("private")).toBe(true);
    expect(isRoadmapVisibility("secret")).toBe(false);
    expect(isRoadmapVisibility(undefined)).toBe(false);
  });

  it("treats a roadmap from before the choice as public", () => {
    expect(visibilityOf({})).toBe("public");
    expect(visibilityOf({ visibility: "private" })).toBe("private");
  });

  it("charges more for a private roadmap", () => {
    expect(roadmapGenerationCost("public")).toBe(ROADMAP_GENERATION_COST);
    expect(roadmapGenerationCost("private")).toBe(
      ROADMAP_PRIVATE_GENERATION_COST,
    );
    expect(ROADMAP_PRIVATE_GENERATION_COST).toBeGreaterThan(
      ROADMAP_GENERATION_COST,
    );
  });

  it("shows a private roadmap to its owner only", () => {
    const secret = { userId: "u1", visibility: "private" as const };
    expect(isRoadmapVisibleTo(secret, "u1")).toBe(true);
    expect(isRoadmapVisibleTo(secret, "u2")).toBe(false);
    expect(isRoadmapVisibleTo(secret, null)).toBe(false);
  });

  it("shows a public roadmap to anyone", () => {
    expect(
      isRoadmapVisibleTo({ userId: "u1", visibility: "public" }, "u2"),
    ).toBe(true);
    expect(isRoadmapVisibleTo({ userId: "u1" }, undefined)).toBe(true);
  });
});
