import { describe, expect, it } from "vitest";

import type { GuitarRarity, PartTier } from "../types/arsenal.types";
import type {
  TraderEffectOffer,
  TraderGuitarOffer,
  TraderModOffer,
  TraderPartOffer,
} from "../types/trader.types";
import { getEffectBom } from "./effectBom";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { getEffectValue } from "./effectStats";
import { getGuitarBom } from "./guitarBom";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";
import { getItemValue, RARITY_BASE_VALUE } from "./itemStats";
import { getModResaleValue } from "./resale";
import { getScrapYield } from "./scrapYield";
import {
  getModBillValue,
  getTraderOffers,
  getTraderRestockAt,
  getTraderShop,
  getTraderWindow,
  ITEM_PRICE_MULTIPLIER,
  MOD_PRICE_MULTIPLIER,
  MOD_ROLL_PREMIUM,
  TRADER_WINDOW_MS,
} from "./traderShop";
import { getModDef, MOD_ROLL_BONUS } from "./workshop";

const dayAt = (index: number) => new Date(index * TRADER_WINDOW_MS + 3_600_000);

const windows = (count: number) =>
  Array.from({ length: count }, (_, i) => getTraderOffers(dayAt(20_000 + i)));

const partOffers = (offers = getTraderOffers(dayAt(20_000))) =>
  offers.filter((o): o is TraderPartOffer => o.kind === "part");

/**
 * What one piece of a part costs the player today, using the cheapest item in the
 * game that yields it: the sell value given up by tearing that item down.
 *
 * This is the number the trader's prices are anchored to, so the test derives it
 * from the real drop data rather than restating a constant.
 */
const cheapestScrapCost = (tier: PartTier): number => {
  let best = Infinity;

  const consider = (sellValue: number, pieces: number) => {
    if (pieces > 0) best = Math.min(best, sellValue / pieces);
  };

  for (const guitar of GUITAR_DEFINITIONS) {
    const yielded = getScrapYield({
      bom: getGuitarBom(guitar.id),
      rarity: guitar.rarity,
    });
    consider(
      RARITY_BASE_VALUE[guitar.rarity],
      yielded
        .filter((p) => p.tier === tier && p.partId !== "screws")
        .reduce((sum, p) => sum + p.qty, 0),
    );
  }

  for (const effect of EFFECT_DEFINITIONS) {
    const yielded = getScrapYield({
      bom: getEffectBom(effect.id, effect.type),
      rarity: effect.rarity,
    });
    consider(
      getEffectValue(effect),
      yielded
        .filter((p) => p.tier === tier && p.partId !== "screws")
        .reduce((sum, p) => sum + p.qty, 0),
    );
  }

  return best;
};

describe("trader windows", () => {
  it("rotates once per UTC day", () => {
    const noon = new Date("2026-08-11T12:00:00.000Z");
    const laterSameDay = new Date("2026-08-11T23:59:59.000Z");
    const nextDay = new Date("2026-08-12T00:00:01.000Z");

    expect(getTraderWindow(noon)).toBe(getTraderWindow(laterSameDay));
    expect(getTraderWindow(nextDay)).toBe(getTraderWindow(noon) + 1);
  });

  it("restocks at the next UTC midnight", () => {
    const restock = getTraderRestockAt(new Date("2026-08-11T12:00:00.000Z"));
    expect(new Date(restock).toISOString()).toBe("2026-08-12T00:00:00.000Z");
  });
});

describe("trader stock", () => {
  it("is identical for the same window and different across windows", () => {
    const morning = getTraderOffers(new Date("2026-08-11T06:00:00.000Z"));
    const evening = getTraderOffers(new Date("2026-08-11T21:30:00.000Z"));
    const tomorrow = getTraderOffers(new Date("2026-08-12T06:00:00.000Z"));

    expect(evening).toEqual(morning);
    expect(tomorrow).not.toEqual(morning);
  });

  it("always stocks screws, pots, two Standard and two Epic slots", () => {
    for (const offers of windows(120)) {
      const parts = partOffers(offers);
      expect(parts.some((p) => p.partId === "screws")).toBe(true);
      expect(parts.filter((p) => p.partId === "pot")).toHaveLength(1);
      // Screws and the pot slot are Standard too, hence the structural filter.
      const structural = parts.filter(
        (p) => p.partId !== "screws" && p.partId !== "pot",
      );
      expect(structural.filter((p) => p.tier === "Standard")).toHaveLength(2);
      expect(structural.filter((p) => p.tier === "Epic")).toHaveLength(2);
    }
  });

  it("never stocks the same part twice at the same tier", () => {
    for (const offers of windows(120)) {
      const keys = partOffers(offers).map((p) => `${p.partId}:${p.tier}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("never sells Unique parts — they gate workshop promotions", () => {
    for (const offers of windows(365)) {
      expect(partOffers(offers).some((p) => p.tier === "Unique")).toBe(false);
    }
  });

  it("puts exactly one part offer on sale, never the screws", () => {
    for (const offers of windows(120)) {
      const parts = partOffers(offers);
      const deals = parts.filter((p) => p.discountPct > 0);
      expect(deals).toHaveLength(1);
      expect(deals[0].partId).not.toBe("screws");
      expect(deals[0].unitPrice).toBeLessThan(deals[0].basePrice);
    }
  });

  it("stocks two featured guitars and two featured effects", () => {
    for (const offers of windows(120)) {
      const guitars = offers.filter(
        (o): o is TraderGuitarOffer => o.kind === "guitar",
      );
      const effects = offers.filter(
        (o): o is TraderEffectOffer => o.kind === "effect",
      );
      expect(guitars).toHaveLength(2);
      expect(effects).toHaveLength(2);
      // Four slots showing the same model twice is not four slots.
      expect(new Set(guitars.map((o) => o.roll.guitarId)).size).toBe(2);
      expect(new Set(effects.map((o) => o.roll.effectId)).size).toBe(2);
    }
  });

  it("offers a Legendary part on roughly a third of days", () => {
    const days = windows(365);
    const withLegendary = days.filter((offers) =>
      partOffers(offers).some((p) => p.tier === "Legendary"),
    ).length;
    expect(withLegendary / days.length).toBeGreaterThan(0.25);
    expect(withLegendary / days.length).toBeLessThan(0.45);
  });

  it("keeps top-rarity featured items rare", () => {
    const days = windows(365);
    const rarityOf = (offers: ReturnType<typeof getTraderOffers>) =>
      offers
        .filter((o) => o.kind === "guitar" || o.kind === "effect")
        .map((o) => {
          const def =
            o.kind === "guitar"
              ? GUITAR_DEFINITIONS.find((g) => g.id === o.roll.guitarId)
              : EFFECT_DEFINITIONS.find((e) => e.id === o.roll.effectId);
          return def?.rarity as GuitarRarity;
        });

    const all = days.flatMap(rarityOf);
    const share = (rarity: GuitarRarity) =>
      all.filter((r) => r === rarity).length / all.length;

    expect(share("Mythic")).toBeLessThan(0.04);
    expect(share("Legendary")).toBeLessThan(0.09);
    // The counter has to be useful on an ordinary day, not just a jackpot one.
    expect(share("Common") + share("Uncommon")).toBeGreaterThan(0.4);
  });
});

describe("trader pricing", () => {
  it("never undercuts scrapping, and stays in band per tier", () => {
    // Measured against the cheapest donor in the game — the route a player who
    // is paying attention actually takes. Staying above it is what keeps the
    // salvage loop the primary source of parts.
    //
    // The working tiers sit at roughly triple: a convenience premium. Legendary
    // sits far higher on purpose — it is the slot that unsticks a walled-off
    // build, not a supply line, and it has to stay too dear to grind against.
    const band: Record<string, [number, number]> = {
      Standard: [2, 4.5],
      Epic: [2, 4.5],
      Legendary: [6, 12],
    };
    const scrapCost: Record<string, number> = {
      Standard: cheapestScrapCost("Standard"),
      Epic: cheapestScrapCost("Epic"),
      Legendary: cheapestScrapCost("Legendary"),
    };

    for (const offers of windows(365)) {
      for (const part of partOffers(offers)) {
        if (part.partId === "screws") continue; // free filler, no donor to give up
        const ratio = part.basePrice / scrapCost[part.tier];
        const [min, max] = band[part.tier];
        expect(ratio).toBeGreaterThanOrEqual(min);
        expect(ratio).toBeLessThanOrEqual(max);
      }
    }
  });

  it("steps up hard between part tiers", () => {
    const price = (tier: PartTier) =>
      Math.min(
        ...windows(120)
          .flatMap(partOffers)
          .filter((p) => p.tier === tier && p.partId !== "screws")
          .map((p) => p.basePrice),
      );

    expect(price("Epic")).toBeGreaterThanOrEqual(2 * price("Standard"));
    expect(price("Legendary")).toBeGreaterThanOrEqual(3 * price("Epic"));
  });

  it("prices a featured guitar at its own sell value times the rarity multiplier", () => {
    for (const offers of windows(120)) {
      for (const offer of offers) {
        if (offer.kind !== "guitar") continue;
        const def = GUITAR_DEFINITIONS.find((g) => g.id === offer.roll.guitarId);
        expect(def).toBeDefined();
        const sellValue = getItemValue({ ...offer.roll, id: offer.id }, def!);
        const expected = sellValue * ITEM_PRICE_MULTIPLIER[def!.rarity];
        // Prices are rounded to 5 / 25, so allow the rounding step itself.
        expect(Math.abs(offer.basePrice - expected)).toBeLessThanOrEqual(25);
        // Buying and selling back must always be a loss, at every rarity.
        expect(sellValue / offer.basePrice).toBeLessThan(0.3);
      }
    }
  });

  it("prices a featured effect at its flat sell value times the multiplier", () => {
    for (const offers of windows(120)) {
      for (const offer of offers) {
        if (offer.kind !== "effect") continue;
        const def = EFFECT_DEFINITIONS.find((e) => e.id === offer.roll.effectId);
        expect(def).toBeDefined();
        const expected =
          getEffectValue(def!) * ITEM_PRICE_MULTIPLIER[def!.rarity];
        expect(Math.abs(offer.basePrice - expected)).toBeLessThanOrEqual(25);
      }
    }
  });

  it("keeps a full day of stock out of reach of a day's practice", () => {
    // A committed player earns ~30 Fame a day (see calculateSessionFame).
    // Clearing the counter has to stay a decision, not a routine.
    const offers = getTraderShop(dayAt(20_000)).offers;
    const total = offers.reduce((sum, o) => sum + o.unitPrice * o.stock, 0);
    expect(total).toBeGreaterThan(300);
  });

  it("leaves something affordable on a single day's earnings", () => {
    for (const offers of windows(120)) {
      const cheapest = Math.min(...offers.map((o) => o.unitPrice));
      expect(cheapest).toBeLessThanOrEqual(30);
    }
  });
});

describe("the day's mod", () => {
  const modOf = (offers: ReturnType<typeof getTraderOffers>) =>
    offers.find((o): o is TraderModOffer => o.kind === "mod");

  it("stocks exactly one, one to a player", () => {
    for (const offers of windows(120)) {
      const mods = offers.filter((o) => o.kind === "mod");
      expect(mods).toHaveLength(1);
      expect(mods[0].stock).toBe(1);
    }
  });

  it("only ever offers a mod that exists in its own pool", () => {
    for (const offers of windows(365)) {
      const mod = modOf(offers)!;
      const def = getModDef(mod.modKind, mod.featureId);
      expect(def).not.toBeNull();
      expect(mod.label).toBe(def!.label);
    }
  });

  it("rolls inside the case range, never the bench's widened one", () => {
    // The workshop has to keep rolling the best numbers in the game, or paying
    // Fame for a component beats doing the work.
    for (const offers of windows(365)) {
      const mod = modOf(offers)!;
      const def = getModDef(mod.modKind, mod.featureId)!;
      expect(mod.points).toBeGreaterThanOrEqual(def.min);
      expect(mod.points).toBeLessThanOrEqual(def.max - MOD_ROLL_BONUS);
      expect(mod.maxPoints).toBe(Math.max(def.min, def.max - MOD_ROLL_BONUS));
    }
  });

  it("draws from both pools over a season", () => {
    const kinds = windows(365).map((offers) => modOf(offers)!.modKind);
    const guitarShare =
      kinds.filter((k) => k === "guitar").length / kinds.length;
    expect(guitarShare).toBeGreaterThan(0.35);
    expect(guitarShare).toBeLessThan(0.65);
  });

  it("never sells a mod for less than its parts cost at the same counter", () => {
    for (const offers of windows(365)) {
      const mod = modOf(offers)!;
      const def = getModDef(mod.modKind, mod.featureId)!;
      const bill = getModBillValue(def);
      // The invariant that matters: buying the mod is never cheaper than buying
      // the parts for it and running the job yourself.
      expect(mod.unitPrice).toBeGreaterThan(bill);
      // Prices are rounded to 5 / 25, so allow the rounding step itself.
      expect(mod.unitPrice).toBeGreaterThanOrEqual(
        bill * MOD_PRICE_MULTIPLIER - 25,
      );
      // And the roll never runs away with the price: the bill dominates.
      expect(mod.unitPrice).toBeLessThanOrEqual(
        bill * MOD_PRICE_MULTIPLIER * (1 + MOD_ROLL_PREMIUM) + 25,
      );
    }
  });

  it("is worth far more fitted than sold straight back", () => {
    for (const offers of windows(120)) {
      const mod = modOf(offers)!;
      const resale = getModResaleValue(mod.modKind, mod.featureId, mod.points);
      expect(resale / mod.unitPrice).toBeLessThan(0.1);
    }
  });

  it("turns over every day", () => {
    const seen = windows(30).map((offers) => {
      const mod = modOf(offers)!;
      return `${mod.modKind}:${mod.featureId}:${mod.points}`;
    });
    expect(new Set(seen).size).toBeGreaterThan(20);
  });
});

describe("trader offer identity", () => {
  it("scopes offer ids to their window", () => {
    const shop = getTraderShop(dayAt(20_000));
    for (const offer of shop.offers) {
      expect(offer.id.startsWith(`${shop.window}-`)).toBe(true);
    }
    expect(new Set(shop.offers.map((o) => o.id)).size).toBe(shop.offers.length);
  });
});
