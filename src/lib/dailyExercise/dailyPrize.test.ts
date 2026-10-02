import { PART_DEFINITIONS } from "feature/arsenal/data/partDefinitions";
import { getModPool } from "feature/arsenal/data/workshop";
import { describe, expect, it } from "vitest";

import { describeDailyPrize, getDailyPrize } from "./dailyPrize";

const days = Array.from({ length: 60 }, (_, i) =>
  new Date(Date.UTC(2026, 9, 1) + i * 86_400_000).toISOString().slice(0, 10),
);
const prizes = days.map(getDailyPrize);

describe("getDailyPrize", () => {
  it("is the same prize all day, on every server and every card", () => {
    expect(getDailyPrize("2026-10-02")).toEqual(getDailyPrize("2026-10-02"));
  });

  it("pays mods and parts both, never gear", () => {
    expect(new Set(prizes.map((p) => p.kind))).toEqual(new Set(["mod", "part"]));
  });

  it("changes from day to day", () => {
    const distinct = new Set(prizes.map((p) => (p.kind === "mod" ? `mod:${p.featureId}` : `part:${p.partId}`)));
    expect(distinct.size).toBeGreaterThan(10);
  });

  it("makes a mod rare: the very top of what the bench can roll", () => {
    for (const prize of prizes) {
      if (prize.kind !== "mod") continue;
      const def = getModPool(prize.modKind).find((m) => m.id === prize.featureId);
      expect(def).toBeDefined();
      expect(prize.points).toBe(def!.max);
    }
  });

  it("makes a part rare: Legendary, and only parts that grade that high", () => {
    for (const prize of prizes) {
      if (prize.kind !== "part") continue;
      expect(prize.tier).toBe("Legendary");
      expect(PART_DEFINITIONS.find((p) => p.id === prize.partId)?.maxTier).toBe("Legendary");
    }
  });
});

describe("a mod prize's description", () => {
  it("names the stat it raises", () => {
    // 2026-10-02 is a Pro low action day: Play Feeling.
    expect(getDailyPrize("2026-10-02")).toMatchObject({
      kind: "mod",
      featureId: "low-action",
      statLabel: "Play Feeling",
    });
    for (const prize of prizes) {
      if (prize.kind === "mod") expect(prize.statLabel).not.toBe("");
    }
  });
});

describe("describeDailyPrize", () => {
  it("names a mod with its points and a part with its tier", () => {
    expect(describeDailyPrize({ kind: "mod", modKind: "guitar", featureId: "sustain", label: "Sustain", points: 6, statLabel: "Sustain" }))
      .toBe("a +6 Sustain mod");
    expect(describeDailyPrize({ kind: "part", partId: "pickup", label: "Pickup", tier: "Legendary" }))
      .toBe("a Legendary Pickup");
  });
});
