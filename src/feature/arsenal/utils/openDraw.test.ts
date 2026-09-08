import { describe, expect, it } from "vitest";

import type { GuitarRarity } from "../types/arsenal.types";
import type { RarityOdds } from "./openDraw";
import { drawOpenRarity, drawRarity, pickBiased } from "./openDraw";

/** The Standard case's table: two thirds of its weight on the bottom two tiers. */
const STANDARD: RarityOdds = {
  Common: 0.38,
  Uncommon: 0.28,
  Rare: 0.2,
  Epic: 0.11,
  Legendary: 0.025,
  Mythic: 0.005,
};

/** The Elite table, which zeroes out the bottom two tiers on purpose. */
const ELITE: RarityOdds = {
  Common: 0,
  Uncommon: 0,
  Rare: 0.5,
  Epic: 0.38,
  Legendary: 0.09,
  Mythic: 0.03,
};

/** Feeds a fixed sequence of rolls, so each draw's two calls are separable. */
const rolls = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

const completed =
  (...rarities: GuitarRarity[]) =>
  (rarity: GuitarRarity) =>
    !rarities.includes(rarity);

describe("drawRarity", () => {
  it("reads the table as cumulative bands", () => {
    expect(drawRarity(STANDARD, () => 0)).toBe("Common");
    expect(drawRarity(STANDARD, () => 0.37)).toBe("Common");
    expect(drawRarity(STANDARD, () => 0.39)).toBe("Uncommon");
    expect(drawRarity(STANDARD, () => 0.9)).toBe("Epic");
    expect(drawRarity(STANDARD, () => 0.999)).toBe("Mythic");
  });

  it("falls back to Common when the table rounds short of the roll", () => {
    expect(drawRarity({ Common: 0.5 }, () => 0.99)).toBe("Common");
  });
});

describe("drawOpenRarity", () => {
  it("keeps the rolled rarity while the player is still missing something at it", () => {
    // Second roll deliberately extreme: it must never be consulted.
    expect(drawOpenRarity(STANDARD, () => true, rolls(0, 0.999))).toBe("Common");
  });

  it("re-rolls when the rolled rarity is fully collected", () => {
    // Common is done; 0.5 of the remaining 0.62 lands inside Uncommon's 0.28.
    expect(
      drawOpenRarity(STANDARD, completed("Common"), rolls(0, 0.5 * (0.62 / 0.62))),
    ).not.toBe("Common");
  });

  it("re-rolls upward once the bottom of the table is exhausted", () => {
    // What the whole rule exists for: Common and Uncommon collected, so the 66%
    // of the table that was a guaranteed duplicate now reaches the tiers above.
    const rarity = drawOpenRarity(
      STANDARD,
      completed("Common", "Uncommon"),
      rolls(0, 0.99),
    );
    expect(rarity).toBe("Epic");
  });

  it("never re-rolls into the chase tiers", () => {
    // The ceiling: Legendary and Mythic keep their printed odds exactly, so
    // finishing the cheap tiers can never become a cheaper route to a Mythic
    // than the Elite case built to sell one.
    const seen = new Set<GuitarRarity>();
    for (let roll = 0; roll < 1; roll += 0.001) {
      seen.add(
        drawOpenRarity(STANDARD, completed("Common", "Uncommon"), rolls(0, roll)),
      );
    }
    expect(seen.has("Legendary")).toBe(false);
    expect(seen.has("Mythic")).toBe(false);
    expect(seen).toEqual(new Set(["Rare", "Epic"]));
  });

  it("steps a collected chase tier down rather than repeating it", () => {
    // The ceiling only ever blocks upgrades *into* Legendary and Mythic. A roll
    // that lands on a collected Legendary still escapes downward — that costs
    // the ladder nothing and is one duplicate fewer.
    expect(
      drawOpenRarity(STANDARD, completed("Legendary"), rolls(0.99, 0.99)),
    ).toBe("Epic");
  });

  it("never re-rolls into a rarity the case does not drop", () => {
    // Elite zeroes Common and Uncommon. The player is missing plenty at both,
    // but a 350-Fame case must not start paying out in Commons.
    const seen = new Set<GuitarRarity>();
    for (let roll = 0; roll < 1; roll += 0.001) {
      seen.add(drawOpenRarity(ELITE, completed("Rare"), rolls(0, roll)));
    }
    expect(seen.has("Common")).toBe(false);
    expect(seen.has("Uncommon")).toBe(false);
    expect(seen).toContain("Epic");
  });

  it("hands back the rolled rarity when nothing is left to discover anywhere", () => {
    // The endgame: every pull is a duplicate again, which is what keeps the
    // scrap and build economy fed.
    expect(drawOpenRarity(STANDARD, () => false, rolls(0.99, 0))).toBe("Legendary");
  });

  it("redistributes the printed odds rather than flattening them", () => {
    // Rare and Epic weigh 0.2 and 0.11 — renormalised over the 0.31 the ceiling
    // leaves reachable that is 64.5%/35.5%, not half each.
    const counts: Partial<Record<GuitarRarity, number>> = {};
    const steps = 100_000;
    for (let i = 0; i < steps; i++) {
      const rarity = drawOpenRarity(
        STANDARD,
        completed("Common", "Uncommon"),
        rolls(0, i / steps),
      );
      counts[rarity] = (counts[rarity] ?? 0) + 1;
    }
    expect((counts.Rare ?? 0) / steps).toBeCloseTo(0.2 / 0.31, 2);
    expect((counts.Epic ?? 0) / steps).toBeCloseTo(0.11 / 0.31, 2);
  });
});

describe("pickBiased", () => {
  const pool = ["a", "b", "c", "d"];
  const owned = (ids: string[]) => (item: string) => ids.includes(item);

  it("draws from the models the player is missing when the bias fires", () => {
    // 0 clears the 0.7 gate; the second roll indexes the two-item missing list.
    expect(pickBiased(pool, owned(["a", "b"]), rolls(0, 0))).toBe("c");
    expect(pickBiased(pool, owned(["a", "b"]), rolls(0, 0.99))).toBe("d");
  });

  it("draws from the whole pool when the bias does not fire", () => {
    expect(pickBiased(pool, owned(["a", "b"]), rolls(0.99, 0))).toBe("a");
  });

  it("falls back to the whole pool when the player owns everything at the rarity", () => {
    expect(pickBiased(pool, () => true, rolls(0, 0))).toBe("a");
  });
});
