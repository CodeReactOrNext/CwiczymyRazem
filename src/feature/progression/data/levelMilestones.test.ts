import { FEATURE_UNLOCK_LIST } from "feature/levelGate/data/featureUnlocks";
import { describe, expect, it } from "vitest";

import { rollLevelReward } from "../utils/levelRewards";
import {
  getClaimableLevels,
  getLevelMilestone,
  getNextMilestone,
  LEVEL_MILESTONES,
  levelPayout,
  levelRewardId,
  MAX_LEVEL,
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
  it("owes every paying rung climbed since the baseline", () => {
    const owed = getClaimableLevels(10, [], 1).map(
      (milestone) => milestone.lvl,
    );
    expect(owed).toStrictEqual([3, 5, 6, 8, 10]);
  });

  it("drops a rung once it has been collected", () => {
    const owed = getClaimableLevels(
      10,
      [levelRewardId(3), levelRewardId(6)],
      1,
    ).map((milestone) => milestone.lvl);
    expect(owed).toStrictEqual([5, 8, 10]);
  });

  it("never owes a rung the account has not reached", () => {
    expect(getClaimableLevels(2, [], 1)).toStrictEqual([]);
  });

  it("never owes a rung climbed before the baseline", () => {
    // The account arrived at level 20 with the ladder already shipped: its
    // history stops there and the back pay is nobody's.
    expect(getClaimableLevels(20, [], 20)).toStrictEqual([]);
  });

  it("pays the rungs climbed after the baseline, and only those", () => {
    const owed = getClaimableLevels(12, [], 6).map(
      (milestone) => milestone.lvl,
    );
    expect(owed).toStrictEqual([8, 10, 12]);
  });

  it("pays the rung the account has just landed on", () => {
    // The baseline is sealed at the level the player stood on before the
    // session, so the level that session earned is owed straight away.
    const owed = getClaimableLevels(10, [], 9).map(
      (milestone) => milestone.lvl,
    );
    expect(owed).toStrictEqual([10]);
  });

  it("skips rungs that only open something", () => {
    // Level 15 pays; a rung with no payout must never appear as owed.
    for (const milestone of getClaimableLevels(100, [], 1)) {
      expect(milestone.payout).not.toBeNull();
    }
  });
});

describe("the ladder past the authored table", () => {
  it("reaches the top and stops there", () => {
    expect(getLevelMilestone(MAX_LEVEL)).toBeDefined();
    expect(getLevelMilestone(MAX_LEVEL + 1)).toBeUndefined();
    expect(levelPayout(MAX_LEVEL + 1)).toBeNull();
  });

  it("leaves no level without a rung once the table runs out", () => {
    // The bug this replaces: the ladder ended at 28 and anybody past it saw an
    // empty screen where the climb ahead should be.
    for (let lvl = 29; lvl <= MAX_LEVEL; lvl++) {
      expect(getLevelMilestone(lvl), `level ${lvl}`).toBeDefined();
      expect(levelPayout(lvl), `level ${lvl}`).not.toBeNull();
    }
  });

  it("does not fill in the gaps the early ladder means to have", () => {
    // 4, 7, 9 are silent on purpose — levels come minutes apart down there.
    for (const lvl of [2, 4, 7, 9, 11, 27]) {
      expect(levelPayout(lvl), `level ${lvl}`).toBeNull();
    }
  });

  it("leaves the hand-tuned rungs exactly as they were", () => {
    expect(levelPayout(3)).toStrictEqual({
      caseTokens: 0,
      parts: [{ tier: "Standard", qty: 2 }],
      mods: 0,
    });
    expect(levelPayout(28)).toStrictEqual({
      caseTokens: 1,
      parts: [{ tier: "Legendary", qty: 4 }],
      mods: 1,
    });
  });

  it("keeps growing without running away", () => {
    const partsAt = (lvl: number) =>
      levelPayout(lvl)!.parts.reduce((sum, slot) => sum + slot.qty, 0);

    expect(partsAt(200)).toBeGreaterThan(partsAt(40));
    // Bounded: the top of the ladder is generous, not absurd.
    expect(partsAt(MAX_LEVEL)).toBeLessThanOrEqual(10);
    expect(levelPayout(MAX_LEVEL)!.caseTokens).toBeLessThanOrEqual(2);
    expect(levelPayout(MAX_LEVEL)!.mods).toBeLessThanOrEqual(2);
  });

  it("only ever asks for a part tier that something can actually roll", () => {
    // `partsAtTier("Unique")` draws from an empty pool — no part definition has
    // that as its `maxTier` — so a slot asking for one would pay a part with no
    // id at all. Every rung is rolled here rather than trusted.
    for (let lvl = 2; lvl <= MAX_LEVEL; lvl++) {
      const milestone = getLevelMilestone(lvl);
      if (!milestone?.payout) continue;

      const reward = rollLevelReward(milestone);
      for (const part of reward!.parts) {
        expect(part.partId, `level ${lvl}`).toBeTruthy();
        expect(part.qty, `level ${lvl}`).toBeGreaterThan(0);
      }
    }
  });
});
