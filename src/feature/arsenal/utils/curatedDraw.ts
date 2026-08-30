import { POOL_RARITY_ORDER } from "../data/dailyCase";
import type { GuitarRarity } from "../types/arsenal.types";

/**
 * Which item comes out of a curated pool — the Featured case's rotating ten,
 * the Supporter case's voted six — once the case has rolled its rarity.
 *
 * ─── Why the open cases' bias is not enough here ────────────────────────────
 *
 * `pickBiased` steers a pull toward models the player is missing *of the rarity
 * already rolled*, which works on the Standard/Premium/Elite cases because they
 * draw from the whole collection: 27 Epics to choose between, so "the Epic you
 * don't have" is nearly always available. A curated pool has no room for that.
 * The Featured pool holds two Epics; the Supporter slate holds exactly one, so
 * every Epic roll for a fortnight returns the same pedal no matter what the
 * player owns, and the bias is a no-op on a pool of one.
 *
 * ─── The rule ───────────────────────────────────────────────────────────────
 *
 * A curated pull never repeats while the pool still holds something the player
 * has not discovered *at or below* the rolled rarity:
 *
 *   1. an undiscovered item of the rolled rarity, if there is one;
 *   2. otherwise the nearest rarity below it that still has one;
 *   3. otherwise a duplicate of the rolled rarity, as before.
 *
 * Step 2 only ever goes down. That is the whole safety property: the rarity
 * roll's printed odds become a ceiling rather than a promise, so no amount of
 * collecting can turn a case into a better case. Letting it search upward would
 * be far more generous and completely farmable — a supporter holding five of
 * the six slate seats would be buying a near-guaranteed Mythic at 300 Fame for
 * the rest of the fortnight, since the Mythic seat would be the only item left
 * for the substitution to find.
 *
 * Duplicates are not eliminated, only deferred: a player who has collected the
 * whole pool is back to pulling repeats, which is what keeps curated cases
 * feeding the scrap and build economy the way the open ones do.
 */
export function pickCuratedDrop<T>(
  pool: readonly T[],
  rolledRarity: GuitarRarity,
  rarityOf: (entry: T) => GuitarRarity,
  isDiscovered: (entry: T) => boolean,
  random: () => number = Math.random,
): T | null {
  const atRarity = (rarity: GuitarRarity): T[] =>
    pool.filter((entry) => rarityOf(entry) === rarity);

  // `?? null` rather than an index: an empty list must not return undefined
  // into a caller that has already narrowed the type.
  const pickOne = (entries: readonly T[]): T | null =>
    entries[Math.floor(random() * entries.length)] ?? null;

  const undiscovered = (entries: readonly T[]): T[] =>
    entries.filter((entry) => !isDiscovered(entry));

  const rolled = atRarity(rolledRarity);

  const fresh = undiscovered(rolled);
  if (fresh.length > 0) return pickOne(fresh);

  // Rarest first, so everything past the rolled rarity's own index is strictly
  // below it and the first hit is the nearest downgrade.
  const rolledIndex = POOL_RARITY_ORDER.indexOf(rolledRarity);
  if (rolledIndex !== -1) {
    for (const rarity of POOL_RARITY_ORDER.slice(rolledIndex + 1)) {
      const lower = undiscovered(atRarity(rarity));
      if (lower.length > 0) return pickOne(lower);
    }
  }

  // Nothing new left below the roll. Pool slots guarantee every rarity is
  // present, so `rolled` is normally the duplicate to hand back; the whole-pool
  // fallback is there for a pool that somehow came up short of a rarity.
  return pickOne(rolled.length > 0 ? rolled : pool);
}
