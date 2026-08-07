import { describe, expect, it } from "vitest";

import type {
  SupportVariantContext,
  SupportVariantId,
} from "./supportVariants";
import {
  getSupportVariantCopy,
  pickSupportVariant,
  SUPPORT_VARIANT_CYCLE,
  SUPPORT_VARIANT_IDS,
} from "./supportVariants";

const covered: SupportVariantContext = {
  raisedThisMonth: 20,
  monthlyGoal: 20,
  totalRaised: 19,
  supporters: 4,
  nextTierLabel: "Luthier: Guitar Parts & Upgrading",
  nextTierAmountToGo: 6,
  tiersFunded: 1,
  tiersTotal: 39,
};

const short: SupportVariantContext = { ...covered, raisedThisMonth: 8 };

/** Variants that claim the servers are at risk — never legitimate once the month is paid. */
const COST_FIRST: SupportVariantId[] = ["server_cost"];

const rotation = (isCovered: boolean) =>
  Array.from({ length: SUPPORT_VARIANT_CYCLE }, (_, i) =>
    pickSupportVariant(i, isCovered),
  );

describe("pickSupportVariant", () => {
  it("leads with the server cost while the month is short", () => {
    expect(pickSupportVariant(0, false)).toBe("server_cost");
  });

  it("never asks for server money once the month is covered", () => {
    const picked = Array.from({ length: 40 }, (_, i) =>
      pickSupportVariant(i, true),
    );

    for (const costFirst of COST_FIRST) {
      expect(picked).not.toContain(costFirst);
    }
  });

  it("runs a full cycle of distinct messages before repeating", () => {
    for (const isCovered of [true, false]) {
      const cycle = rotation(isCovered);

      expect(new Set(cycle).size).toBe(SUPPORT_VARIANT_CYCLE);
      expect(pickSupportVariant(SUPPORT_VARIANT_CYCLE, isCovered)).toBe(
        cycle[0],
      );
    }
  });

  it("keeps a multi-day gap before a message comes back around", () => {
    expect(SUPPORT_VARIANT_CYCLE).toBeGreaterThanOrEqual(5);
  });

  it("wraps around the pool for any shown-count, including negatives", () => {
    expect(pickSupportVariant(-1, true)).toBe(
      pickSupportVariant(SUPPORT_VARIANT_CYCLE - 1, true),
    );
  });
});

describe("getSupportVariantCopy", () => {
  it("renders every variant without leaking empty or placeholder text", () => {
    for (const variant of SUPPORT_VARIANT_IDS) {
      for (const ctx of [covered, short]) {
        const copy = getSupportVariantCopy(variant, ctx);

        for (const line of [copy.eyebrow, copy.headline, copy.body]) {
          expect(line.length).toBeGreaterThan(0);
          expect(line).not.toMatch(/undefined|null|NaN|\$-/);
        }
      }
    }
  });

  it("survives a log written before the tier fields existed", () => {
    const legacy: SupportVariantContext = {
      raisedThisMonth: 8,
      monthlyGoal: 20,
      totalRaised: 0,
      supporters: 0,
    };

    for (const variant of SUPPORT_VARIANT_IDS) {
      const copy = getSupportVariantCopy(variant, legacy);

      expect(copy.headline).not.toMatch(/undefined|null|NaN/);
      expect(copy.body).not.toMatch(/undefined|null|NaN/);
    }
  });

  it("points a covered month at the roadmap instead of the servers", () => {
    const copy = getSupportVariantCopy("roadmap_tier", covered);

    expect(copy.headline).toContain("$6 to go");
    expect(copy.body).toContain("hosting is already paid for");
  });

  it("keeps the tier-ladder framing while the month is short", () => {
    expect(getSupportVariantCopy("roadmap_tier", short).body).toContain(
      "tier by tier",
    );
  });

  it("reports how far the tier ladder has been climbed", () => {
    const copy = getSupportVariantCopy("roadmap_momentum", covered);

    expect(copy.headline).toBe("1 of 39 roadmap goals funded so far");
    expect(copy.body).toContain("Luthier: Guitar Parts & Upgrading");
  });

  it("falls back to the tier card when a variant has no data to show", () => {
    const noCounts = { ...covered, tiersFunded: 0, tiersTotal: null };

    expect(getSupportVariantCopy("roadmap_momentum", noCounts)).toEqual(
      getSupportVariantCopy("roadmap_tier", noCounts),
    );
  });

  it("thanks the community once every tier is funded", () => {
    const copy = getSupportVariantCopy("roadmap_tier", {
      ...covered,
      nextTierLabel: null,
      nextTierAmountToGo: null,
    });

    expect(copy.headline).toContain("funded");
  });

  it("redirects the stays-free ask to the roadmap when hosting is paid", () => {
    expect(getSupportVariantCopy("value_received", covered).body).toContain(
      "roadmap",
    );
    expect(getSupportVariantCopy("value_received", short).body).not.toContain(
      "roadmap",
    );
  });
});
