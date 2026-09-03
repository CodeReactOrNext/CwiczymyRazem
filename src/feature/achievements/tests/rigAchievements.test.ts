import type { ArsenalSummary } from "feature/arsenal/data/arsenalSummary";
import { EMPTY_ARSENAL_SUMMARY } from "feature/arsenal/data/arsenalSummary";
import { describe, expect, it } from "vitest";

import { rigAchievements } from "../data/categories/rigAchievements";
import type { AchievementContext, AchievementList } from "../types";

const ctxOf = (arsenal: Partial<ArsenalSummary>): AchievementContext =>
  ({ arsenal: { ...EMPTY_ARSENAL_SUMMARY, ...arsenal } }) as AchievementContext;

const def = (id: AchievementList) => rigAchievements.find((a) => a.id === id)!;

const passes = (id: AchievementList, arsenal: Partial<ArsenalSummary>) =>
  def(id).check(ctxOf(arsenal));

describe("rig achievements", () => {
  it("earns nothing on an account with no arsenal", () => {
    const ctx = ctxOf({});
    expect(rigAchievements.filter((a) => a.check(ctx))).toEqual([]);
  });

  it("unlocks the rig ladder at each threshold and not below it", () => {
    expect(passes("rig_50", { rigLevel: 49 })).toBe(false);
    expect(passes("rig_50", { rigLevel: 50 })).toBe(true);
    expect(passes("rig_150", { rigLevel: 150 })).toBe(true);
    expect(passes("rig_1000", { rigLevel: 999 })).toBe(false);
    expect(passes("rig_1000", { rigLevel: 1000 })).toBe(true);
  });

  it("reports rig progress capped by the tier it belongs to", () => {
    expect(def("rig_300").getProgress!(ctxOf({ rigLevel: 124 }))).toEqual({
      current: 124,
      max: 300,
      unit: "lvl",
    });
  });

  it("unlocks a rarity badge off one owned item of that rarity", () => {
    expect(passes("first_mythic", { ownedByRarity: { ...EMPTY_ARSENAL_SUMMARY.ownedByRarity, Mythic: 1 } })).toBe(true);
    expect(passes("first_mythic", { ownedByRarity: { ...EMPTY_ARSENAL_SUMMARY.ownedByRarity, Legendary: 9 } })).toBe(false);
  });

  it("does not ask for a Custom Shop item to complete the rarity set", () => {
    const droppable = {
      ...EMPTY_ARSENAL_SUMMARY.ownedByRarity,
      Common: 1,
      Uncommon: 1,
      Rare: 1,
      Epic: 1,
      Legendary: 1,
      Mythic: 1,
    };

    expect(passes("rarity_full_set", { ownedByRarity: droppable })).toBe(true);
    expect(def("rarity_full_set").getProgress!(ctxOf({ ownedByRarity: droppable }))).toEqual({
      current: 6,
      max: 6,
    });
  });

  it("gates the museum shelf, the globe and the serial correctly", () => {
    expect(passes("museum_1", { museumCount: 1 })).toBe(true);
    expect(passes("museum_5", { museumCount: 4 })).toBe(false);
    expect(passes("museum_5", { museumCount: 5 })).toBe(true);
    expect(passes("globetrotter", { countryCount: 7 })).toBe(false);
    expect(passes("globetrotter", { countryCount: 8 })).toBe(true);
    expect(passes("serial_one", { bestSerial: 2 })).toBe(false);
    expect(passes("serial_one", { bestSerial: 1 })).toBe(true);
  });

  it("does not hand the vintage badge to a stash with no dated guitar", () => {
    expect(passes("vintage_1970", { oldestGuitarYear: null })).toBe(false);
    expect(passes("vintage_1970", { oldestGuitarYear: 1970 })).toBe(false);
    expect(passes("vintage_1970", { oldestGuitarYear: 1969 })).toBe(true);
  });
});
