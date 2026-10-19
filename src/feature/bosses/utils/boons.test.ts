import { describe, expect, it } from "vitest";

import type { BoonId } from "./boons";
import { boonBpmShift, BOONS, buildOf, dealDraft, DRAFT_SIZE } from "./boons";
import { AFFIX_FROM, SLAMS_FROM } from "./phaseGenerator";

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 104729 + 1);

describe("dealDraft", () => {
  it("deals three different boons, the same ones for the same run, phase and reroll", () => {
    const draft = dealDraft(7, 5, {});
    expect(draft).toHaveLength(DRAFT_SIZE);
    expect(new Set(draft).size).toBe(DRAFT_SIZE);
    expect(dealDraft(7, 5, {})).toEqual(draft);
    const rerolled = SEEDS.slice(0, 20).filter((seed) =>
      dealDraft(seed, 5, {}, 1).join() !== dealDraft(seed, 5, {}).join(),
    );
    expect(rerolled.length).toBeGreaterThan(10);
  });

  it("never deals a boon the run already holds at its cap", () => {
    const capped = Object.fromEntries(
      BOONS.filter((b) => b.max < 99).map((b) => [b.id, b.max]),
    ) as Partial<Record<BoonId, number>>;
    for (const seed of SEEDS.slice(0, 50)) {
      for (const id of dealDraft(seed, 12, capped)) {
        expect(["shield", "bandage"]).toContain(id);
      }
    }
  });

  it("keeps boons back until the threat they answer can show up", () => {
    for (const seed of SEEDS) {
      const early = dealDraft(seed, SLAMS_FROM - 1, {});
      expect(early).not.toContain("steadyHand");
      expect(dealDraft(seed, AFFIX_FROM - 2, {})).not.toContain("antidote");
    }
    const later = new Set(SEEDS.flatMap((seed) => dealDraft(seed, AFFIX_FROM, {})));
    expect(later.has("antidote")).toBe(true);
    expect(later.has("steadyHand")).toBe(true);
  });

  it("deals epics more seldom than commons", () => {
    const counts = { common: 0, epic: 0 };
    for (const seed of SEEDS) {
      for (const id of dealDraft(seed, 8, {})) {
        const rarity = BOONS.find((b) => b.id === id)!.rarity;
        if (rarity === "common") counts.common += 1;
        if (rarity === "epic") counts.epic += 1;
      }
    }
    expect(counts.epic).toBeGreaterThan(0);
    expect(counts.common).toBeGreaterThan(counts.epic * 2);
  });
});

describe("boonBpmShift", () => {
  it("slows the run down or speeds it up", () => {
    expect(boonBpmShift({})).toBe(0);
    expect(boonBpmShift({ slowDown: 2 })).toBe(-10);
    expect(boonBpmShift({ slowDown: 1, overdrive: 1 })).toBe(5);
  });
});

describe("buildOf", () => {
  it("lists the run's boons, biggest stacks first", () => {
    expect(buildOf({ blade: 1, armor: 3, shield: 0 })).toEqual([
      { id: "armor", stacks: 3 },
      { id: "blade", stacks: 1 },
    ]);
  });
});
