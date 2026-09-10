import { FEATURE_UNLOCK_LIST } from "feature/levelGate/data/featureUnlocks";
import { describe, expect, it } from "vitest";

import {
  getClaimableLevels,
  getLevelMilestone,
  getNextMilestone,
  LEVEL_MILESTONES,
  levelRewardId,
} from "./levelMilestones";
import { RARITY_UNLOCK_LEVELS } from "./rarityCap";

describe("the ladder", () => {
  it("climbs, without repeating a rung", () => {
    const levels = LEVEL_MILESTONES.map((milestone) => milestone.lvl);
    expect(levels).toStrictEqual([...new Set(levels)].sort((a, b) => a - b));
  });

  it("puts a rung on every level a rarity opens at", () => {
    for (const lvl of RARITY_UNLOCK_LEVELS) {
      expect(getLevelMilestone(lvl)?.unlocks).toContainEqual(
        expect.objectContaining({ kind: "rarity" }),
      );
    }
  });

  it("puts a rung on every level a page opens at", () => {
    for (const feature of FEATURE_UNLOCK_LIST) {
      expect(getLevelMilestone(feature.requiredLvl)?.unlocks).toContainEqual({
        kind: "feature",
        feature: feature.id,
      });
    }
  });

  it("carries both kinds of unlock on a level that opens two things", () => {
    // Level 3 opens Rare gear and the Milestones page at once.
    expect(getLevelMilestone(3)?.unlocks).toStrictEqual([
      { kind: "rarity", rarity: "Rare" },
      { kind: "feature", feature: "summary" },
    ]);
  });

  it("never pays a currency the leaderboard or the shop runs on", () => {
    for (const milestone of LEVEL_MILESTONES) {
      if (!milestone.payout) continue;
      expect(milestone.payout).not.toHaveProperty("fame");
      expect(milestone.payout).not.toHaveProperty("points");
    }
  });

  it("pays something on every rung that pays at all", () => {
    for (const { payout } of LEVEL_MILESTONES) {
      if (!payout) continue;
      const total =
        payout.caseTokens +
        payout.mods +
        payout.parts.reduce((sum, slot) => sum + slot.qty, 0);
      expect(total).toBeGreaterThan(0);
    }
  });
});

describe("getNextMilestone", () => {
  it("looks strictly upward", () => {
    expect(getNextMilestone(1)?.lvl).toBe(3);
    expect(getNextMilestone(3)?.lvl).toBe(5);
  });

  it("runs out once the account is past the top rung", () => {
    const top = LEVEL_MILESTONES[LEVEL_MILESTONES.length - 1].lvl;
    expect(getNextMilestone(top)).toBeNull();
  });
});

describe("getClaimableLevels", () => {
  it("owes every paying rung the account has climbed past", () => {
    const owed = getClaimableLevels(10, []).map((milestone) => milestone.lvl);
    expect(owed).toStrictEqual([3, 5, 6, 8, 10]);
  });

  it("drops a rung once it has been collected", () => {
    const owed = getClaimableLevels(10, [
      levelRewardId(3),
      levelRewardId(6),
    ]).map((milestone) => milestone.lvl);
    expect(owed).toStrictEqual([5, 8, 10]);
  });

  it("never owes a rung the account has not reached", () => {
    expect(getClaimableLevels(2, [])).toStrictEqual([]);
  });

  it("skips rungs that only open something", () => {
    // Level 15 pays; a rung with no payout must never appear as owed.
    for (const milestone of getClaimableLevels(100, [])) {
      expect(milestone.payout).not.toBeNull();
    }
  });
});
