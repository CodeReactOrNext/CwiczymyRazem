import type { PartId, PartTier, ScrapPart } from "../types/arsenal.types";
import { EFFECT_DEFINITIONS } from "./effectDefinitions";
import { GUITAR_DEFINITIONS } from "./guitarDefinitions";
import { RARITY_MAX_FEATURES } from "./itemStats";
import {
  BUILD_LADDER_LENGTH,
  getBuildRecipeParts,
  getEffectSubject,
  getFittableMods,
  getGuitarSubject,
  type WorkshopSubject,
} from "./workshop";

/**
 * How much of each part the workshop actually *asks for*, measured off the real
 * recipes — the other half of `partSupply.ts`.
 *
 * Supply alone said nothing about whether a part is needed. The trader used to
 * weight its shelf by supply only, and the two halves of the game pulled against
 * each other: `getStructuralParts` puts the best-supplied part first in every
 * recipe, so `opamp` headed the build ladder of nearly every pedal — and the same
 * high supply number made the counter stock it *least*. Players levelling pedals
 * waited weeks for a Legendary op-amp, while Legendary tuners, which no build
 * recipe asks for at all, took the slot more often than anything else.
 *
 * Derived, not authored: a new item, a new mod or a re-ordered recipe moves this
 * table on the next build.
 *
 * Per definition it counts:
 * - the whole authored build ladder (`BUILD_LADDER_LENGTH` levels), and
 * - one fit of an average mod from what that instrument can take, for every mod
 *   slot it has at its mint rarity.
 *
 * Unweighted by drop rate, for the same reason supply is: the trader only ever
 * compares parts *within one tier*.
 */
const DEMAND = ((): Map<string, number> => {
  const tally = new Map<string, number>();
  const count = (parts: ScrapPart[], scale = 1) => {
    for (const part of parts) {
      const key = `${part.partId}:${part.tier}`;
      tally.set(key, (tally.get(key) ?? 0) + part.qty * scale);
    }
  };

  const countSubject = (subject: WorkshopSubject) => {
    for (let level = 1; level <= BUILD_LADDER_LENGTH; level++) {
      count(getBuildRecipeParts(level, subject.bom, subject.mintRarity));
    }
    const mods = getFittableMods(subject);
    if (mods.length === 0) return;
    const slots = RARITY_MAX_FEATURES[subject.mintRarity] ?? 2;
    for (const mod of mods) count(mod.parts, slots / mods.length);
  };

  const blank = { id: "", condition: undefined, buildLevel: 0, features: [] };
  for (const guitar of GUITAR_DEFINITIONS) {
    countSubject(getGuitarSubject(blank, guitar));
  }
  for (const effect of EFFECT_DEFINITIONS) {
    countSubject(getEffectSubject(blank, effect));
  }
  return tally;
})();

export const getPartDemand = (partId: PartId, tier: PartTier): number =>
  DEMAND.get(`${partId}:${tier}`) ?? 0;
