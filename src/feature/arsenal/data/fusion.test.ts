import { describe, expect, it } from "vitest";

import type { PartTier, ScrapPart } from "../types/arsenal.types";
import {
  applyFusion,
  canFuse,
  countHeldParts,
  FUSION_FAME_COST,
  FUSION_INPUT_COUNT,
  getFusionOutputTier,
  getFusionQuote,
  getMaxFusionCrafts,
} from "./fusion";
import { PART_DEFINITIONS, PART_TIERS } from "./partDefinitions";
import { PART_RESALE_VALUE } from "./resale";

const wallet = (...parts: ScrapPart[]): ScrapPart[] => parts;

describe("getFusionOutputTier", () => {
  it("steps a part up exactly one tier", () => {
    expect(getFusionOutputTier("pickup", "Standard")).toBe("Epic");
    expect(getFusionOutputTier("pickup", "Epic")).toBe("Legendary");
    expect(getFusionOutputTier("pickup", "Legendary")).toBe("Unique");
  });

  /**
   * The one that would break the economy. A roster-wide teardown pays out 753
   * screws against ~100 of every other part combined, so a screw that could
   * climb is an unlimited supply of Unique parts.
   */
  it("never lets screws leave Standard", () => {
    for (const tier of PART_TIERS) {
      expect(getFusionOutputTier("screws", tier)).toBeNull();
    }
  });

  it("stops a pot at its own ceiling", () => {
    expect(getFusionOutputTier("pot", "Standard")).toBe("Epic");
    expect(getFusionOutputTier("pot", "Epic")).toBeNull();
  });

  it("only lets visibly unique parts reach Unique", () => {
    for (const def of PART_DEFINITIONS) {
      const output = getFusionOutputTier(def.id, "Legendary");
      expect(output === "Unique").toBe(Boolean(def.unique));
    }
  });

  it("never takes a Unique as an input", () => {
    for (const def of PART_DEFINITIONS) {
      expect(getFusionOutputTier(def.id, "Unique")).toBeNull();
    }
  });

  it("respects every part's declared maxTier", () => {
    for (const def of PART_DEFINITIONS) {
      for (const tier of PART_TIERS) {
        const output = getFusionOutputTier(def.id, tier);
        if (!output || output === "Unique") continue;
        expect(PART_TIERS.indexOf(output)).toBeLessThanOrEqual(
          PART_TIERS.indexOf(def.maxTier),
        );
      }
    }
  });

  it("agrees with canFuse", () => {
    for (const def of PART_DEFINITIONS) {
      for (const tier of PART_TIERS) {
        expect(canFuse(def.id, tier)).toBe(
          getFusionOutputTier(def.id, tier) !== null,
        );
      }
    }
  });
});

/**
 * The bench must never be worth more than what it consumes, or a large enough
 * stash becomes a Fame printer: rework, sell the output, repeat. `resale.ts`
 * owns those prices, so this measures the ratios against it rather than against
 * numbers copied in here.
 */
describe("no arbitrage against the resale bin", () => {
  it("costs more to rework a stack than the piece it produces sells for", () => {
    const steps: [PartTier, PartTier][] = [
      ["Standard", "Epic"],
      ["Epic", "Legendary"],
      ["Legendary", "Unique"],
    ];

    for (const [from, to] of steps) {
      const quote = getFusionQuote("pickup", from)!;
      const spent = PART_RESALE_VALUE[from] * quote.inputQty + quote.fame;

      expect(spent).toBeGreaterThan(PART_RESALE_VALUE[to]);
    }
  });

  it("keeps every rework strictly lossy even before the Fame fee", () => {
    // The fee is a margin on top, not the thing holding the floor up — a future
    // tuning pass that drops it to zero must not open the printer.
    expect(
      PART_RESALE_VALUE.Standard * FUSION_INPUT_COUNT.Standard,
    ).toBeGreaterThanOrEqual(PART_RESALE_VALUE.Epic);
    expect(
      PART_RESALE_VALUE.Epic * FUSION_INPUT_COUNT.Epic,
    ).toBeGreaterThanOrEqual(PART_RESALE_VALUE.Legendary);
    expect(
      PART_RESALE_VALUE.Legendary * FUSION_INPUT_COUNT.Legendary,
    ).toBeGreaterThanOrEqual(PART_RESALE_VALUE.Unique);
  });

  it("asks for more pieces the thinner the tier gets", () => {
    expect(FUSION_INPUT_COUNT.Standard).toBeGreaterThan(
      FUSION_INPUT_COUNT.Epic,
    );
    expect(FUSION_INPUT_COUNT.Epic).toBeGreaterThan(
      FUSION_INPUT_COUNT.Legendary,
    );
  });
});

describe("getFusionQuote", () => {
  it("prices one craft off the input tier's count", () => {
    const quote = getFusionQuote("pickup", "Standard")!;

    expect(quote).toMatchObject({
      partId: "pickup",
      inputTier: "Standard",
      outputTier: "Epic",
      ratio: FUSION_INPUT_COUNT.Standard,
      crafts: 1,
      inputQty: FUSION_INPUT_COUNT.Standard,
      fame: FUSION_FAME_COST,
    });
  });

  it("scales linearly — the fee is per piece produced", () => {
    const quote = getFusionQuote("body", "Epic", 3)!;

    expect(quote.crafts).toBe(3);
    expect(quote.inputQty).toBe(FUSION_INPUT_COUNT.Epic * 3);
    expect(quote.fame).toBe(FUSION_FAME_COST * 3);
  });

  it("refuses a job that goes nowhere", () => {
    expect(getFusionQuote("screws", "Standard")).toBeNull();
    expect(getFusionQuote("pot", "Epic")).toBeNull();
    expect(getFusionQuote("neck", "Legendary")).toBeNull();
  });

  it("refuses a quantity that is not a whole positive number", () => {
    expect(getFusionQuote("pickup", "Standard", 0)).toBeNull();
    expect(getFusionQuote("pickup", "Standard", -2)).toBeNull();
    expect(getFusionQuote("pickup", "Standard", Number.NaN)).toBeNull();
  });

  it("floors a fractional quantity rather than billing a fraction", () => {
    expect(getFusionQuote("pickup", "Standard", 2.9)!.crafts).toBe(2);
  });
});

describe("countHeldParts", () => {
  it("sums split stacks of the same part and tier", () => {
    const held = wallet(
      { partId: "pickup", tier: "Epic", qty: 3 },
      { partId: "pickup", tier: "Epic", qty: 2 },
      { partId: "pickup", tier: "Legendary", qty: 9 },
      { partId: "body", tier: "Epic", qty: 9 },
    );

    expect(countHeldParts(held, "pickup", "Epic")).toBe(5);
  });

  it("counts nothing the wallet does not hold", () => {
    expect(countHeldParts([], "pickup", "Epic")).toBe(0);
  });
});

describe("applyFusion", () => {
  it("takes the inputs and pays out the tier above", () => {
    const held = wallet({ partId: "pickup", tier: "Epic", qty: 9 });
    const quote = getFusionQuote("pickup", "Epic", 2)!;

    const after = applyFusion(held, quote);

    expect(countHeldParts(after, "pickup", "Epic")).toBe(
      9 - FUSION_INPUT_COUNT.Epic * 2,
    );
    expect(countHeldParts(after, "pickup", "Legendary")).toBe(2);
  });

  it("stacks onto a tier the wallet already holds instead of opening a row", () => {
    const held = wallet(
      { partId: "pickup", tier: "Epic", qty: 4 },
      { partId: "pickup", tier: "Legendary", qty: 3 },
    );

    const after = applyFusion(held, getFusionQuote("pickup", "Epic")!);

    expect(
      after.filter((p) => p.partId === "pickup" && p.tier === "Legendary"),
    ).toHaveLength(1);
    expect(countHeldParts(after, "pickup", "Legendary")).toBe(4);
  });

  it("drops a stack it has emptied rather than leaving a zero", () => {
    const held = wallet({ partId: "body", tier: "Legendary", qty: 3 });

    const after = applyFusion(held, getFusionQuote("body", "Legendary")!);

    expect(after.some((p) => p.tier === "Legendary")).toBe(false);
    expect(countHeldParts(after, "body", "Unique")).toBe(1);
  });

  it("leaves every other part in the wallet alone", () => {
    const held = wallet(
      { partId: "pickup", tier: "Epic", qty: 4 },
      { partId: "body", tier: "Epic", qty: 7 },
      { partId: "screws", tier: "Standard", qty: 40 },
    );

    const after = applyFusion(held, getFusionQuote("pickup", "Epic")!);

    expect(countHeldParts(after, "body", "Epic")).toBe(7);
    expect(countHeldParts(after, "screws", "Standard")).toBe(40);
  });

  /** The full climb a build ladder's Unique slot actually asks a player for. */
  it("climbs Standard to Unique in three reworks", () => {
    const pieces =
      FUSION_INPUT_COUNT.Standard *
      FUSION_INPUT_COUNT.Epic *
      FUSION_INPUT_COUNT.Legendary;
    let held = wallet({ partId: "bridge", tier: "Standard", qty: pieces });

    for (const tier of ["Standard", "Epic", "Legendary"] as const) {
      const crafts = getMaxFusionCrafts(held, "bridge", tier, 10_000);
      held = applyFusion(held, getFusionQuote("bridge", tier, crafts)!);
    }

    expect(pieces).toBe(60);
    expect(countHeldParts(held, "bridge", "Unique")).toBe(1);
    // Nothing stranded on the way up: each step consumed its input exactly.
    expect(held).toHaveLength(1);
  });
});

describe("getMaxFusionCrafts", () => {
  const rich = 10_000;

  it("is bounded by the stack", () => {
    const held = wallet({ partId: "pickup", tier: "Standard", qty: 12 });

    // 12 pieces at five a craft — two, with two left over.
    expect(getMaxFusionCrafts(held, "pickup", "Standard", rich)).toBe(2);
  });

  it("is bounded by Fame", () => {
    const held = wallet({ partId: "pickup", tier: "Standard", qty: 100 });

    expect(
      getMaxFusionCrafts(held, "pickup", "Standard", FUSION_FAME_COST * 3),
    ).toBe(3);
  });

  it("is zero when the stack is short of a single craft", () => {
    const held = wallet({ partId: "pickup", tier: "Standard", qty: 4 });

    expect(getMaxFusionCrafts(held, "pickup", "Standard", rich)).toBe(0);
  });

  it("is zero when the player cannot pay the fee", () => {
    const held = wallet({ partId: "pickup", tier: "Standard", qty: 50 });

    expect(getMaxFusionCrafts(held, "pickup", "Standard", 0)).toBe(0);
  });

  it("never goes negative on a debt", () => {
    const held = wallet({ partId: "pickup", tier: "Standard", qty: 50 });

    expect(getMaxFusionCrafts(held, "pickup", "Standard", -500)).toBe(0);
  });

  it("is zero for a part that cannot climb, however much of it is held", () => {
    const held = wallet({ partId: "screws", tier: "Standard", qty: 999 });

    expect(getMaxFusionCrafts(held, "screws", "Standard", rich)).toBe(0);
  });
});
