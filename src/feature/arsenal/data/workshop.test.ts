import { describe, expect, it } from "vitest";

import type {
  GuitarRarity,
  PartId,
  PartTier,
  ScrapPart,
} from "../types/arsenal.types";
import { getGuitarBom } from "./guitarBom";
import { getItemCondition } from "./itemStats";
import {
  countPP,
  getBuildFameCost,
  getBuildPPCost,
  getBuildQuote,
  getBuildRequirement,
  getBuildUniqueCost,
  getRepairQuote,
  PART_TIER_PP,
  planPayment,
  subtractParts,
  type WorkshopSubject,
} from "./workshop";

/** A Stratocaster BOM: pickup / neck / body / tuners — four distinct parts. */
const STRAT_BOM = getGuitarBom(1);

const subject = (over: Partial<WorkshopSubject> = {}): WorkshopSubject => ({
  id: "item-1",
  kind: "guitar",
  name: "Test Guitar",
  rarity: "Rare",
  buildLevel: 0,
  condition: 0.5,
  bom: STRAT_BOM,
  ...over,
});

const part = (partId: PartId, tier: PartTier, qty: number): ScrapPart => ({
  partId,
  tier,
  qty,
});

/** Enough Standard stock to pay for anything early, spread across the Strat BOM. */
const richWallet = (): ScrapPart[] => [
  part("body", "Standard", 40),
  part("neck", "Standard", 40),
  part("pickup", "Standard", 40),
  part("tuners", "Standard", 40),
  part("pot", "Standard", 40),
  part("screws", "Standard", 40),
];

describe("build cost curve", () => {
  it("grows geometrically and never flattens", () => {
    expect(getBuildPPCost(1)).toBe(6);
    expect(getBuildPPCost(5)).toBe(20);
    expect(getBuildPPCost(10)).toBe(90);
    expect(getBuildPPCost(15)).toBe(401);
    expect(getBuildPPCost(20)).toBe(1797);
  });

  it("has no level cap — every level is priced", () => {
    for (let level = 1; level < 60; level++) {
      expect(getBuildPPCost(level + 1)).toBeGreaterThan(getBuildPPCost(level));
    }
    expect(Number.isFinite(getBuildPPCost(100))).toBe(true);
  });

  it("charges Fame on the side", () => {
    expect(getBuildFameCost(1)).toBe(10);
    expect(getBuildFameCost(12)).toBe(120);
  });
});

describe("getBuildRequirement", () => {
  it("widens the recipe band by band", () => {
    expect(getBuildRequirement(1, 4)).toMatchObject({
      distinctParts: 1,
      minTier: "Standard",
      condition: "Good",
      uniqueParts: 0,
    });
    expect(getBuildRequirement(5, 4)).toMatchObject({
      distinctParts: 2,
      minTier: "Standard",
    });
    expect(getBuildRequirement(9, 4)).toMatchObject({
      distinctParts: 3,
      minTier: "Epic",
      condition: "Mint",
    });
    expect(getBuildRequirement(15, 4)).toMatchObject({
      distinctParts: 4,
      minTier: "Epic",
    });
    expect(getBuildRequirement(20, 4)).toMatchObject({
      distinctParts: 4,
      minTier: "Legendary",
      condition: "Museum",
    });
  });

  it("never demands more distinct parts than the BOM physically has", () => {
    expect(getBuildRequirement(30, 3).distinctParts).toBe(3);
    expect(getBuildRequirement(30, 4).distinctParts).toBe(4);
  });

  it("starts demanding Unique parts at 19 and keeps adding them forever", () => {
    expect(getBuildUniqueCost(12)).toBe(0);
    expect(getBuildUniqueCost(18)).toBe(0);
    expect(getBuildUniqueCost(19)).toBe(1);
    expect(getBuildUniqueCost(26)).toBe(2);
    expect(getBuildUniqueCost(33)).toBe(3);
    expect(getBuildUniqueCost(103)).toBe(13);
  });
});

describe("planPayment", () => {
  const baseReq = {
    kind: "guitar" as const,
    minTier: "Standard" as const,
    distinctParts: 0,
    bomParts: [],
    uniqueParts: 0,
  };

  it("covers the price and reports what it took", () => {
    const payment = planPayment({ ...baseReq, wallet: richWallet(), pp: 25 });
    expect(payment).not.toBeNull();
    expect(payment!.pp).toBeGreaterThanOrEqual(25);
    expect(countPP(payment!.parts)).toBe(payment!.pp);
  });

  it("spends the cheapest stock first so good parts survive", () => {
    const wallet = [
      part("pickup", "Legendary", 5),
      part("screws", "Standard", 20),
    ];
    const payment = planPayment({ ...baseReq, wallet, pp: 10 })!;
    expect(payment.parts).toEqual([
      { partId: "screws", tier: "Standard", qty: 10 },
    ]);
  });

  it("never touches Unique parts unless the level demands them", () => {
    const wallet = [part("body", "Unique", 3), part("screws", "Standard", 60)];
    const payment = planPayment({ ...baseReq, wallet, pp: 40 })!;
    expect(payment.parts.some((p) => p.tier === "Unique")).toBe(false);
  });

  it("includes the Unique parts a high level asks for", () => {
    const wallet = [part("body", "Unique", 3), part("screws", "Standard", 60)];
    const payment = planPayment({
      ...baseReq,
      wallet,
      pp: 40,
      uniqueParts: 2,
    })!;
    const uniques = payment.parts.filter((p) => p.tier === "Unique");
    expect(uniques.reduce((s, p) => s + p.qty, 0)).toBe(2);
  });

  it("refuses stock below the required tier", () => {
    const wallet = [part("screws", "Standard", 500)];
    expect(
      planPayment({ ...baseReq, wallet, pp: 20, minTier: "Epic" }),
    ).toBeNull();
  });

  it("requires one piece of each demanded BOM part", () => {
    const wallet = [part("pickup", "Standard", 50)];
    expect(
      planPayment({
        ...baseReq,
        wallet,
        pp: 6,
        distinctParts: 3,
        bomParts: ["pickup", "neck", "body"],
      }),
    ).toBeNull();

    const complete = [
      part("pickup", "Standard", 10),
      part("neck", "Standard", 10),
      part("body", "Standard", 10),
    ];
    const payment = planPayment({
      ...baseReq,
      wallet: complete,
      pp: 6,
      distinctParts: 3,
      bomParts: ["pickup", "neck", "body"],
    })!;
    expect(new Set(payment.parts.map((p) => p.partId))).toEqual(
      new Set(["pickup", "neck", "body"]),
    );
  });

  it("keeps a guitar off the pedal half of the wallet", () => {
    const wallet = [
      part("opamp", "Legendary", 10),
      part("diode", "Legendary", 10),
    ];
    expect(planPayment({ ...baseReq, wallet, pp: 12 })).toBeNull();
    expect(
      planPayment({ ...baseReq, kind: "effect", wallet, pp: 12 }),
    ).not.toBeNull();
  });

  it("lets both sides spend shared parts", () => {
    const wallet = [part("pot", "Epic", 10)];
    expect(planPayment({ ...baseReq, wallet, pp: 8 })).not.toBeNull();
    expect(
      planPayment({ ...baseReq, kind: "effect", wallet, pp: 8 }),
    ).not.toBeNull();
  });

  it("returns null when the wallet is simply too thin", () => {
    expect(
      planPayment({
        ...baseReq,
        wallet: [part("screws", "Standard", 3)],
        pp: 50,
      }),
    ).toBeNull();
  });
});

describe("subtractParts", () => {
  it("removes exactly what was spent and drops emptied stacks", () => {
    const wallet = [part("screws", "Standard", 10), part("pot", "Epic", 2)];
    const left = subtractParts(wallet, [
      part("screws", "Standard", 4),
      part("pot", "Epic", 2),
    ]);
    expect(left).toEqual([{ partId: "screws", tier: "Standard", qty: 6 }]);
  });

  it("leaves untouched tiers of the same part alone", () => {
    const wallet = [part("pickup", "Standard", 5), part("pickup", "Epic", 5)];
    const left = subtractParts(wallet, [part("pickup", "Standard", 5)]);
    expect(left).toEqual([{ partId: "pickup", tier: "Epic", qty: 5 }]);
  });
});

describe("getBuildQuote", () => {
  it("blocks the job when the item is too battered, and says so", () => {
    const quote = getBuildQuote(
      subject({ condition: 0.2 }),
      richWallet(),
      9999,
    );
    const condition = quote.checks.find((c) => c.kind === "condition")!;
    expect(condition.ok).toBe(false);
    expect(condition.detail).toBe("Good");
    expect(quote.canBuild).toBe(false);
    expect(quote.payment).toBeNull();
  });

  it("clears a level-1 job on a decent guitar and names the mod", () => {
    const quote = getBuildQuote(
      subject({ condition: 0.5 }),
      richWallet(),
      9999,
    );
    expect(quote.canBuild).toBe(true);
    expect(quote.payment!.pp).toBeGreaterThanOrEqual(6);
    expect(quote.modName).not.toBe("");
    expect(quote.requirement.level).toBe(1);
  });

  it("pays out per rarity while charging everyone the same", () => {
    const wallet = richWallet();
    const gains: Record<string, number> = {};
    const costs = new Set<number>();
    for (const rarity of ["Common", "Rare", "Mythic"] as GuitarRarity[]) {
      const quote = getBuildQuote(
        subject({ rarity, condition: 0.95 }),
        wallet,
        9999,
      );
      gains[rarity] = quote.gain;
      costs.add(quote.requirement.pp);
    }
    expect(gains.Mythic).toBeGreaterThan(gains.Rare);
    expect(gains.Rare).toBeGreaterThan(gains.Common);
    expect(costs.size).toBe(1);
  });

  it("reports Fame as a blocker of its own", () => {
    const quote = getBuildQuote(subject({ condition: 0.5 }), richWallet(), 0);
    expect(quote.checks.find((c) => c.kind === "fame")!.ok).toBe(false);
    expect(quote.canBuild).toBe(false);
  });

  it("only lists the Unique requirement once a level actually has one", () => {
    const low = getBuildQuote(
      subject({ buildLevel: 0, condition: 0.95 }),
      richWallet(),
      9999,
    );
    expect(low.checks.some((c) => c.kind === "unique")).toBe(false);

    const high = getBuildQuote(
      subject({ buildLevel: 18, condition: 0.95 }),
      richWallet(),
      9999,
    );
    expect(high.checks.find((c) => c.kind === "unique")).toMatchObject({
      required: 1,
      ok: false,
    });
  });

  it("never spends more than the wallet holds", () => {
    const wallet = richWallet();
    const quote = getBuildQuote(subject({ condition: 0.95 }), wallet, 9999);
    for (const spent of quote.payment!.parts) {
      const held = wallet.find(
        (p) => p.partId === spent.partId && p.tier === spent.tier,
      )!;
      expect(spent.qty).toBeLessThanOrEqual(held.qty);
    }
  });
});

describe("getRepairQuote", () => {
  it("walks the condition ladder one grade at a time", () => {
    expect(
      getRepairQuote(subject({ condition: 0.05 }), richWallet()).target,
    ).toBe("Worn");
    expect(
      getRepairQuote(subject({ condition: 0.2 }), richWallet()).target,
    ).toBe("Good");
    expect(
      getRepairQuote(subject({ condition: 0.5 }), richWallet()).target,
    ).toBe("Mint");
    expect(
      getRepairQuote(subject({ condition: 0.8 }), richWallet()).target,
    ).toBe("Museum");
  });

  it("has nothing left to do at Museum grade", () => {
    const quote = getRepairQuote(subject({ condition: 0.96 }), richWallet());
    expect(quote.target).toBeNull();
    expect(quote.canRepair).toBe(false);
  });

  it("gets steeper the higher the grade and the rarer the item", () => {
    const wallet = richWallet();
    const early = getRepairQuote(subject({ condition: 0.05 }), wallet).pp;
    const late = getRepairQuote(subject({ condition: 0.8 }), wallet).pp;
    expect(late).toBeGreaterThan(early);

    const common = getRepairQuote(
      subject({ rarity: "Common", condition: 0.5 }),
      wallet,
    ).pp;
    const mythic = getRepairQuote(
      subject({ rarity: "Mythic", condition: 0.5 }),
      wallet,
    ).pp;
    expect(mythic).toBeGreaterThan(common);
  });

  it("reports the Item Level the step is worth", () => {
    const quote = getRepairQuote(subject({ condition: 0.43 }), richWallet());
    expect(quote.gain).toBe(3); // 0.43 → 0.73 is +3 condition points
  });

  it("accepts junk parts — it is the entry-level sink", () => {
    const quote = getRepairQuote(subject({ condition: 0.5 }), [
      part("screws", "Standard", 200),
    ]);
    expect(quote.canRepair).toBe(true);
    expect(quote.payment!.parts[0].partId).toBe("screws");
  });
});

describe("part points", () => {
  it("prices tiers far enough apart that rarity actually matters", () => {
    expect(PART_TIER_PP.Standard).toBe(1);
    expect(PART_TIER_PP.Epic).toBe(4);
    expect(PART_TIER_PP.Legendary).toBe(12);
    expect(PART_TIER_PP.Unique).toBe(40);
  });
});

describe("condition fallback", () => {
  it("gives legacy items without a rolled condition a stable value", () => {
    const a = getItemCondition({ id: "legacy-item" });
    const b = getItemCondition({ id: "legacy-item" });
    expect(a).toBe(b);
  });
});
