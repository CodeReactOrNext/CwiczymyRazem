import { RARITY_LADDER } from "feature/arsenal/data/itemStats";
import { describe, expect, it } from "vitest";

import {
  canEquipRarity,
  getRaritiesUnlockedAt,
  getRarityCap,
  getRarityLockedAtLvl,
  RARITY_UNLOCK_LEVELS,
  RARITY_UNLOCK_LVL,
} from "./rarityCap";

describe("canEquipRarity", () => {
  it("opens a rarity on its level, not after it", () => {
    expect(canEquipRarity("Legendary", 9)).toBe(false);
    expect(canEquipRarity("Legendary", 10)).toBe(true);
    expect(canEquipRarity("Legendary", 40)).toBe(true);
  });

  it("never shuts the bottom of the ladder", () => {
    expect(canEquipRarity("Common", 1)).toBe(true);
    expect(canEquipRarity("Uncommon", 1)).toBe(true);
  });
});

describe("the ladder itself", () => {
  it("never opens a rarer item before a commoner one", () => {
    const levels = RARITY_LADDER.map((rarity) => RARITY_UNLOCK_LVL[rarity]);
    expect(levels).toStrictEqual([...levels].sort((a, b) => a - b));
  });

  it("covers every rarity in the game", () => {
    for (const rarity of RARITY_LADDER) {
      expect(RARITY_UNLOCK_LVL[rarity]).toBeGreaterThan(0);
    }
  });

  it("stays inside the levels a player actually reaches", () => {
    // Rank badges stop at 28 and that is where the real curve tops out; a
    // threshold above it would be a rarity nobody can ever put in a rig.
    expect(Math.max(...Object.values(RARITY_UNLOCK_LVL))).toBeLessThanOrEqual(
      28,
    );
  });
});

describe("getRarityCap", () => {
  it("reports the best rarity the level can wear", () => {
    expect(getRarityCap(1)).toBe("Uncommon");
    expect(getRarityCap(3)).toBe("Rare");
    expect(getRarityCap(9)).toBe("Epic");
    expect(getRarityCap(10)).toBe("Legendary");
    expect(getRarityCap(100)).toBe("Custom Shop");
  });
});

describe("getRaritiesUnlockedAt", () => {
  it("lists what a single level opens", () => {
    expect(getRaritiesUnlockedAt(1)).toStrictEqual(["Common", "Uncommon"]);
    expect(getRaritiesUnlockedAt(3)).toStrictEqual(["Rare"]);
    expect(getRaritiesUnlockedAt(4)).toStrictEqual([]);
  });

  it("names every level the ladder moves on", () => {
    expect(RARITY_UNLOCK_LEVELS).toStrictEqual([3, 6, 10, 15, 20]);
  });
});

describe("getRarityLockedAtLvl", () => {
  it("reports the level to reach only while the rarity is shut", () => {
    expect(getRarityLockedAtLvl("Mythic", 4)).toBe(15);
    expect(getRarityLockedAtLvl("Mythic", 15)).toBeUndefined();
  });
});
