import { getModDef } from "feature/arsenal/data/workshop";
import { describe, expect, it } from "vitest";

import { getLevelMilestone } from "../data/levelMilestones";
import { rollLevelMods, rollLevelReward } from "./levelRewards";

const milestone = (lvl: number) => {
  const found = getLevelMilestone(lvl);
  if (!found) throw new Error(`no rung at level ${lvl}`);
  return found;
};

describe("rollLevelMods", () => {
  it("draws exactly what the rung promised", () => {
    expect(rollLevelMods(8, 1)).toHaveLength(1);
    expect(rollLevelMods(8, 0)).toStrictEqual([]);
  });

  it("hands the same mod back every time it is asked", () => {
    expect(rollLevelMods(12, 1)).toStrictEqual(rollLevelMods(12, 1));
  });

  it("draws a real feature, priced inside its own range", () => {
    for (const mod of rollLevelMods(28, 3)) {
      const def = getModDef(mod.kind, mod.featureId);
      expect(def).not.toBeNull();
      expect(mod.points).toBeGreaterThanOrEqual(def!.min);
      // The bench's roll bonus is not on offer here, so a reward can never
      // out-roll the best the workshop itself would build.
      expect(mod.points).toBeLessThanOrEqual(def!.max);
    }
  });
});

describe("rollLevelReward", () => {
  it("resolves the rung's slots into real parts", () => {
    const reward = rollLevelReward(milestone(10));
    expect(reward?.parts).toHaveLength(1);
    expect(reward?.parts[0].tier).toBe("Epic");
    expect(reward?.parts[0].qty).toBe(3);
    expect(reward?.caseTokens).toBe(1);
  });

  it("is the same reward on the screen and on the server", () => {
    expect(rollLevelReward(milestone(28))).toStrictEqual(
      rollLevelReward(milestone(28)),
    );
  });

  it("stamps the ledger id the claim is recorded under", () => {
    expect(rollLevelReward(milestone(5))?.rewardId).toBe("level_5");
  });

  it("pays nothing for a rung that only opens something", () => {
    expect(rollLevelReward({ lvl: 4, unlocks: [], payout: null })).toBeNull();
  });
});
