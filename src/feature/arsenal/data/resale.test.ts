import { describe, expect, it } from "vitest";

import type { GuitarRarity, PartTier } from "../types/arsenal.types";
import { CASE_DEFINITIONS } from "./caseDefinitions";
import { getEffectBom } from "./effectBom";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { EFFECT_FEATURES } from "./effectStats";
import { getGuitarBom } from "./guitarBom";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";
import { GUITAR_FEATURES, RARITY_BASE_VALUE } from "./itemStats";
import {
  getModResaleValue,
  getPartResaleValue,
  MOD_RESALE_PER_POINT,
  PART_RESALE_VALUE,
} from "./resale";
import { getScrapYield } from "./scrapYield";
import { getModOfferPrice, getPartUnitPrice } from "./traderShop";
import { getModPool, MOD_ROLL_BONUS } from "./workshop";

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
    expect(getModResaleValue("guitar", "coil-split", 6)).toBeGreaterThan(
      getModResaleValue("guitar", "coil-split", 1),
    );
  });

  it("moves the price by a noticeable amount per point", () => {
    // The roll is the half of a mod a player can buy with parts, so it has to be
    // worth buying. A point used to be worth half a Fame.
    const step =
      getModResaleValue("guitar", "coil-split", 4) -
      getModResaleValue("guitar", "coil-split", 3);
    expect(step).toBe(MOD_RESALE_PER_POINT);
    expect(step).toBeGreaterThanOrEqual(2);
  });

  it("pays the same for a cheap mod as for a dear one", () => {
    // Deliberate. The case roller picks features without looking at rarity, so a
    // bill-driven price would pay hundreds for whatever fell off a Common. The
    // spread between a `gold-jacks` and a `midi` is the marketplace's job.
    expect(getModResaleValue("effect", "gold-jacks", 4)).toBe(
      getModResaleValue("effect", "midi", 4),
    );
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

  it("clears a Legendary part by a wide margin, however poor the roll", () => {
    // A part is a currency and a mod is not: the bench can rebuild the part and
    // can no longer build the mod at all.
    for (const def of [...GUITAR_FEATURES, ...EFFECT_FEATURES]) {
      const kind = GUITAR_FEATURES.includes(def as never) ? "guitar" : "effect";
      const worst = getModResaleValue(kind, def.id, def.min);
      expect(worst, `${def.id} pays too little`).toBeGreaterThan(
        PART_RESALE_VALUE.Legendary,
      );
    }
  });

  it("never approaches what the trader charges for the same mod", () => {
    // The counter has to stay a place to buy mods, never a money pump: buying
    // one and binning it straight back must lose most of the Fame.
    for (const kind of ["guitar", "effect"] as const) {
      for (const def of getModPool(kind)) {
        // What the counter would charge for its best possible roll.
        const traderPrice = getModOfferPrice(def, def.max - MOD_ROLL_BONUS);
        const binned = getModResaleValue(kind, def.id, def.max);
        expect(binned, `${def.id} is too close to the counter`).toBeLessThan(
          traderPrice * 0.25,
        );
      }
    }
  });
});

/**
 * Selling an instrument has to beat tearing its *chassis* down and binning the
 * pieces, for every guitar in the game. Otherwise the sell button is a trap and
 * the scrap button is the economy.
 *
 * The mod a teardown hands back is deliberately not in this sum any more. It is
 * not a piece of the instrument — it is a component that was bolted to it, one
 * the bench cannot make and the player can refit — and a Common pedal worth 8
 * Fame can carry one the trader lists at 2000. Holding the mod under the chassis
 * it happened to arrive on is what kept mods worth 5 Fame. What stops the loop
 * from printing Fame is the case that feeds it, measured below.
 */
describe("stripping a chassis is never the richer move", () => {
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

      expect(fromParts).toBeLessThan(saleValue);
    });
  }
});

/**
 * The guard that actually matters: scrapping must never print Fame.
 *
 * A case is the only source of gear, it costs Fame up front, and it hands back
 * one item — whose teardown yields its parts plus *one* mod, however many it
 * carried. So the whole liquidation loop is bounded by the case price, and that
 * is the number to measure against rather than the chassis.
 */
describe("liquidating a case pull never pays for the case", () => {
  const CHEAPEST_CASE = Math.min(
    ...Object.values(CASE_DEFINITIONS).map((c) => c.fameCost),
  );

  const bestMod = (kind: "guitar" | "effect") =>
    Math.max(
      ...getModPool(kind).map((def) =>
        getModResaleValue(kind, def.id, def.max),
      ),
    );

  // The rarities a cheap case actually returns most of the time. A Mythic out of
  // a Standard case is a jackpot, not an exploit, and it is worth keeping.
  for (const rarity of ["Common", "Uncommon"] as const) {
    it(`${rarity} guitar: parts plus its best mod stay far under a case`, () => {
      const guitar = GUITAR_DEFINITIONS.find((g) => g.rarity === rarity)!;
      const fromParts = getScrapYield({
        bom: getGuitarBom(guitar.id),
        rarity,
      }).reduce(
        (fame, part) =>
          fame + getPartResaleValue(part.partId, part.tier, part.qty),
        0,
      );

      expect(fromParts + bestMod("guitar")).toBeLessThan(CHEAPEST_CASE / 3);
    });
  }

  it("holds for pedals too", () => {
    const effect = EFFECT_DEFINITIONS.find((e) => e.rarity === "Common")!;
    const fromParts = getScrapYield({
      bom: getEffectBom(effect.id, effect.type),
      rarity: "Common",
    }).reduce(
      (fame, part) =>
        fame + getPartResaleValue(part.partId, part.tier, part.qty),
      0,
    );

    expect(fromParts + bestMod("effect")).toBeLessThan(CHEAPEST_CASE / 3);
  });
});
