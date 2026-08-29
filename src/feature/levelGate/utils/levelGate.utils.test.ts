import { describe, expect, it } from "vitest";

import {
  FEATURE_UNLOCKS,
  getLockedAtLvl,
  isFeatureUnlocked,
} from "../data/featureUnlocks";
import { buildLevelTrack, pointsToReachLvl } from "./levelGate.utils";

describe("isFeatureUnlocked", () => {
  it("opens the feature on the required level, not after it", () => {
    expect(isFeatureUnlocked("guilds", 4)).toBe(false);
    expect(isFeatureUnlocked("guilds", 5)).toBe(true);
    expect(isFeatureUnlocked("guilds", 12)).toBe(true);
  });

  it("reports the level still to reach only while locked", () => {
    expect(getLockedAtLvl("summary", 1)).toBe(
      FEATURE_UNLOCKS.summary.requiredLvl,
    );
    expect(getLockedAtLvl("summary", 3)).toBeUndefined();
  });
});

describe("pointsToReachLvl", () => {
  it("counts the points missing before the level flips", () => {
    // (35 + lvl) * lvl — level 3 starts at 74 total points.
    expect(pointsToReachLvl(0, 3)).toBe(74);
    expect(pointsToReachLvl(50, 3)).toBe(24);
  });

  it("never goes negative once the level is already reached", () => {
    expect(pointsToReachLvl(500, 3)).toBe(0);
  });
});

describe("buildLevelTrack", () => {
  it("is empty when the feature is already open", () => {
    expect(buildLevelTrack(5, 5)).toEqual([]);
  });

  it("marks where you are and what you are climbing to", () => {
    expect(buildLevelTrack(3, 5)).toEqual([
      { kind: "level", lvl: 3, state: "current" },
      { kind: "level", lvl: 4, state: "todo" },
      { kind: "level", lvl: 5, state: "target" },
    ]);
  });

  it("collapses a long climb instead of wrapping the row", () => {
    expect(buildLevelTrack(1, 9)).toEqual([
      { kind: "level", lvl: 1, state: "current" },
      { kind: "level", lvl: 2, state: "todo" },
      { kind: "gap" },
      { kind: "level", lvl: 9, state: "target" },
    ]);
  });
});
