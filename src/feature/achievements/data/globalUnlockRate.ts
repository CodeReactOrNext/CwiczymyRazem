import type { AchievementsRarityType } from "./achievementsRarity";

type Rarity = AchievementsRarityType["rarity"];

/**
 * Placeholder for "% of all players who hold this badge".
 *
 * TODO: replace with a real count. The shape this wants is one aggregate document
 * — badge id to holder count, plus a total-players figure — written by a
 * scheduled job rather than counted per request, because the only honest way to
 * get it is a pass over every account's `statistics.achievements`.
 *
 * Two deliberate properties in the meantime, so swapping in real numbers changes
 * the values without changing how the screen behaves:
 *
 *  • **Stable.** Derived from the id, not `Math.random()`, so a row shows the
 *    same figure on every render and every reload. A percentage that reshuffles
 *    while you look at it reads as broken, and it would also make the list
 *    reorder itself on each paint, since rows sort on this.
 *
 *  • **Banded by rarity.** A common badge lands high and an epic one low, the
 *    way the real distribution will, so the list is laid out and reviewed
 *    against realistic numbers instead of noise.
 */
const RARITY_BANDS: Record<Rarity, [min: number, max: number]> = {
  common: [46.5, 92.4],
  rare: [21.8, 58.3],
  veryRare: [5.9, 27.6],
  epic: [0.4, 9.2],
};

/** FNV-1a, for a well-spread fraction out of an id. */
const fractionOf = (id: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 100000) / 100000;
};

/** Share of players holding this badge, to one decimal, as Steam shows it. */
export const getGlobalUnlockRate = (id: string, rarity: Rarity): number => {
  const [min, max] = RARITY_BANDS[rarity];
  return Math.round((min + fractionOf(id) * (max - min)) * 10) / 10;
};
