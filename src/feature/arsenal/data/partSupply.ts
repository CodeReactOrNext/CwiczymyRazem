import type { PartId, PartTier } from "../types/arsenal.types";
import { getEffectBom } from "./effectBom";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { getGuitarBom } from "./guitarBom";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";
import { getScrapYield } from "./scrapYield";

/**
 * How obtainable each part actually is, measured off the real drop tables.
 *
 * A BOM says what an item is *made of*; it does not say what the game can *supply*.
 * The two come apart badly at the top tiers, because a part only reaches Legendary
 * from the first two salvage slots of a definition that exists at Legendary or
 * Mythic — and nothing guarantees such a definition was ever authored.
 *
 * `tuners` was the worst case: it heads exactly one archetype, and that archetype
 * has no Legendary entry at all, so the entire Legendary supply of tuners in the
 * game was a single Mythic guitar paying out one piece. Every recipe that asked
 * for tuners at Legendary was unpayable in practice, which hard-blocked a third of
 * the roster partway up the build ladder.
 *
 * So recipes rank the parts they could ask for by this table instead of by BOM
 * order. It is derived, not authored: add a Legendary guitar to a starved
 * archetype and the recipes rebalance themselves on the next build.
 */

/**
 * Pieces one teardown of every item in the game would pay out, per part and tier.
 *
 * Deliberately unweighted by drop rate. Ranking only ever compares parts *within
 * one BOM at one tier*, and the items that yield a given tier all sit at the same
 * rarity — so a rate weighting would cancel out and only add a second table to
 * keep in sync with `caseDefinitions`.
 */
const SUPPLY = ((): Map<string, number> => {
  const tally = new Map<string, number>();
  const count = (parts: ReturnType<typeof getScrapYield>) => {
    for (const part of parts) {
      const key = `${part.partId}:${part.tier}`;
      tally.set(key, (tally.get(key) ?? 0) + part.qty);
    }
  };

  for (const guitar of GUITAR_DEFINITIONS) {
    count(getScrapYield({ bom: getGuitarBom(guitar.id), rarity: guitar.rarity }));
  }
  for (const effect of EFFECT_DEFINITIONS) {
    count(
      getScrapYield({
        bom: getEffectBom(effect.id, effect.type),
        rarity: effect.rarity,
      }),
    );
  }
  return tally;
})();

export const getPartSupply = (partId: PartId, tier: PartTier): number =>
  SUPPLY.get(`${partId}:${tier}`) ?? 0;

/**
 * The tier recipes rank by. Legendary is the binding constraint — every part a
 * build asks for is abundant at Standard and Epic, and it is the Legendary slots
 * that decide whether the top of the ladder is reachable at all.
 */
export const SUPPLY_RANK_TIER: PartTier = "Legendary";
