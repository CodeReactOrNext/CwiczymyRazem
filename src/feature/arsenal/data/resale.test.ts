import { describe, expect, it } from "vitest";

import type { GuitarRarity, PartTier } from "../types/arsenal.types";
import { EFFECT_FEATURES, getEffectValue } from "./effectStats";
import { getGuitarBom } from "./guitarBom";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";
import { GUITAR_FEATURES, RARITY_BASE_VALUE } from "./itemStats";
import {
  getModResaleValue,
  getPartResaleValue,
  MOD_POINTS_PER_FAME,
  MOD_RESALE_BASE,
  PART_RESALE_VALUE,
} from "./resale";
import { getScrapYield } from "./scrapYield";
import { getPartUnitPrice } from "./traderShop";

const TIERS: PartTier[] = ["Standard", "Epic", "Legendary", "Unique"];

/** Nothing sold out of the stash may reach the price of the cheapest guitar. */
const CHEAPEST_GUITAR = RARITY_BASE_VALUE.Common;

describe("getPartResaleValue", () => {
  it("pays a flat price per tier, whatever the part", () => {
    expect(getPartResaleValue("pickup", "Epic", 1)).toBe(
      getPartResaleValue("body", "Epic", 1),
    );
  });

  it("scales with the stack", () => {
    const one = getPartResaleValue("pickup", "Epic", 1);
    expect(getPartResaleValue("pickup", "Epic", 4)).toBe(one * 4);
  });

  it("pays nothing for nothing", () => {
    expect(getPartResaleValue("pickup", "Epic", 0)).toBe(0);
  });

  it("never pays zero for a piece, however cheap the tier", () => {
    for (const tier of TIERS) {
      expect(getPartResaleValue("screws", tier, 1)).toBeGreaterThan(0);
    }
  });

  it("keeps a single piece under the cheapest guitar in the game", () => {
    for (const tier of TIERS) {
      expect(getPartResaleValue("body", tier, 1)).toBeLessThan(CHEAPEST_GUITAR);
    }
  });

  it("is a rounding error next to what the trader charges", () => {
    // The counter sells a Legendary part for hundreds; the bin pays single
    // digits. Anything close to parity turns the trader into a money pump.
    for (const tier of ["Standard", "Epic", "Legendary"] as const) {
      const trader = getPartUnitPrice("body", tier);
      expect(getPartResaleValue("body", tier, 1)).toBeLessThan(trader * 0.25);
    }
  });
});

describe("getModResaleValue", () => {
  it("pays more for a better roll of the same mod", () => {
    expect(
      getModResaleValue("guitar", "coil-split", MOD_POINTS_PER_FAME * 3),
    ).toBeGreaterThan(getModResaleValue("guitar", "coil-split", 1));
  });

  it("prices a pedal mod as readily as a guitar one", () => {
    expect(getModResaleValue("effect", "nos-opamp", 3)).toBeGreaterThan(0);
  });

  it("refuses to price a mod that is in neither pool", () => {
    expect(getModResaleValue("guitar", "definitely-not-a-mod", 4)).toBe(0);
  });

  it("does not pay for a mod fitted to the wrong kind", () => {
    expect(getModResaleValue("guitar", "nos-opamp", 3)).toBe(0);
  });

  it("keeps even a perfect roll under the cheapest guitar in the game", () => {
    // The best a mod can ever be is its pool maximum plus the bench's bonus.
    for (const def of [...GUITAR_FEATURES, ...EFFECT_FEATURES]) {
      const kind = GUITAR_FEATURES.includes(def as never) ? "guitar" : "effect";
      const best = getModResaleValue(kind, def.id, def.max + 2);
      expect(best, `${def.id} pays too much`).toBeLessThan(CHEAPEST_GUITAR);
    }
  });
});

/**
 * The one that matters: selling an instrument has to beat tearing it down and
 * selling the pieces, for every guitar in the game. Otherwise the sell button is
 * a trap and the scrap button is the economy.
 */
describe("stripping is never the richer move", () => {
  const rarities = new Set<GuitarRarity>();

  for (const guitar of GUITAR_DEFINITIONS) {
    // One guitar per rarity is enough — value is driven by rarity, and the BOMs
    // repeat across the catalogue.
    if (rarities.has(guitar.rarity)) continue;
    rarities.add(guitar.rarity);

    it(`${guitar.rarity}: ${guitar.brand} ${guitar.name}`, () => {
      // Compared against the *base* sale value: condition and vintage only ever
      // multiply it upwards from here, so clearing this bar clears every copy
      // worth keeping. A relic nobody wants is allowed to be worth stripping —
      // that is what the scrap button is for.
      const saleValue = RARITY_BASE_VALUE[guitar.rarity];

      const parts = getScrapYield({
        bom: getGuitarBom(guitar.id),
        rarity: guitar.rarity,
      });
      const fromParts = parts.reduce(
        (fame, part) =>
          fame + getPartResaleValue(part.partId, part.tier, part.qty),
        0,
      );
      // Plus the single best mod the teardown could possibly hand back.
      const bestMod = Math.max(
        ...GUITAR_FEATURES.map((def) =>
          getModResaleValue("guitar", def.id, def.max + 2),
        ),
      );

      expect(fromParts + bestMod).toBeLessThan(saleValue);
    });
  }
});

describe("selling an effect beats stripping it too", () => {
  it("pays less for the mod than for the cheapest pedal", () => {
    const bestMod = Math.max(
      ...EFFECT_FEATURES.map((def) =>
        getModResaleValue("effect", def.id, def.max + 2),
      ),
    );
    expect(bestMod).toBeLessThan(getEffectValue({ rarity: "Common" }));
  });

  it("prices the mod base as flavour, not income", () => {
    expect(MOD_RESALE_BASE).toBeLessThan(PART_RESALE_VALUE.Legendary);
  });
});
