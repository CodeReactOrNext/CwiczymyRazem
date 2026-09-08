import { POOL_RARITY_ORDER } from "../data/dailyCase";
import type { GuitarRarity } from "../types/arsenal.types";

/** Partial: `Custom Shop` has no drop chance — it is workshop-only. */
export type RarityOdds = Partial<Record<GuitarRarity, number>>;

/**
 * How often a pull prefers a model the player does not own yet, once the rarity
 * is settled.
 *
 * Not 100%, because duplicates are load-bearing elsewhere — they are the scrap
 * and build economy's raw material, and a stream that never repeats starves the
 * workshop. This is the lever that keeps a trickle of them coming even while the
 * player still has models to find.
 */
export const NEW_ITEM_BIAS = 0.7;

/**
 * The highest rarity a re-roll is allowed to land on.
 *
 * Everything above it — Legendary and Mythic — keeps the odds printed on the
 * case card, exactly, forever. That is the whole reason the ceiling exists.
 *
 * Without one, the re-roll's weight redistribution reaches the top of the table
 * and completing the cheap tiers quietly buys better chase odds: a Standard case
 * with Common and Uncommon collected rolls Mythic at 7% instead of 0.5%, which
 * makes 120 Fame a better route to a Mythic than the 350-Fame Elite case built
 * to sell exactly that. The ladder is the product; the re-roll is a fix for
 * duplicates, and it has no business repricing the top of the shop.
 *
 * The cost is a late-game wall. A player who has collected everything up to and
 * including Epic has nothing the re-roll can reach, so their pulls go back to
 * being duplicates while Legendary and Mythic are still outstanding. That is
 * accepted: it is a small, late population, and they are the ones the chase
 * tiers are still holding something for.
 */
const REROLL_CEILING: GuitarRarity = "Epic";

/**
 * Is this rarity at or below the re-roll ceiling?
 *
 * `POOL_RARITY_ORDER` is rarest first, so "at or below" is a higher index.
 */
const withinCeiling = (rarity: GuitarRarity): boolean =>
  POOL_RARITY_ORDER.indexOf(rarity) >= POOL_RARITY_ORDER.indexOf(REROLL_CEILING);

/** One rarity off the case's printed table. */
export function drawRarity(
  odds: RarityOdds,
  random: () => number = Math.random,
): GuitarRarity {
  const roll = random();
  let cumulative = 0;
  for (const [rarity, prob] of Object.entries(odds) as [GuitarRarity, number][]) {
    cumulative += prob ?? 0;
    if (roll < cumulative) return rarity;
  }
  return "Common";
}

/**
 * The open cases' rarity roll, with a second roll when the first one lands on a
 * rarity the player has already collected in full.
 *
 * ─── Why the first roll is not enough ───────────────────────────────────────
 *
 * `pickBiased` steers a pull toward models the player is missing, but only
 * *within the rarity already rolled*. That leaves it powerless exactly where the
 * complaints come from: once every Common is in the Dex, a Common roll has an
 * empty "missing" list to filter, and the bias falls straight through to a
 * duplicate. It is not a soft failure — it is a guarantee, and the low rarities
 * carry most of the weight on every table. The Standard case puts 66% of its
 * mass on Common and Uncommon, which between them hold ten guitars and five
 * effects; a player is through both inside a couple of dozen cases and then two
 * pulls in three are a certainty rather than a roll.
 *
 * ─── The rule ───────────────────────────────────────────────────────────────
 *
 * When the rolled rarity has nothing left to discover, the roll is taken again
 * across the rarities that do and sit at or below `REROLL_CEILING`, weighted by
 * the case's own printed odds renormalised over them. The player keeps the
 * distribution they paid for, redistributed over the part of it that can still
 * hand them something new.
 *
 * The re-roll reaches upward as well as down — a collected Common becomes an
 * Uncommon, Rare or Epic — which is the point: those are the tiers players
 * finish first and the ones carrying most of every table's weight. What it may
 * never reach is Legendary or Mythic; see `REROLL_CEILING` for why the chase
 * tiers are walled off from it.
 *
 * A player with nothing left to discover under the ceiling is back to the
 * original behaviour: the first roll stands and the pulls are duplicates. That
 * is what keeps the endgame feeding the workshop.
 */
export function drawOpenRarity(
  odds: RarityOdds,
  hasUndiscovered: (rarity: GuitarRarity) => boolean,
  random: () => number = Math.random,
): GuitarRarity {
  const rolled = drawRarity(odds, random);
  if (hasUndiscovered(rolled)) return rolled;

  // `prob > 0` first: a rarity the case never drops must not become reachable
  // just because the player is missing something at it — Elite cases would
  // start handing out the Commons their table zeroes out on purpose.
  const live = (Object.entries(odds) as [GuitarRarity, number][]).filter(
    ([rarity, prob]) =>
      (prob ?? 0) > 0 && withinCeiling(rarity) && hasUndiscovered(rarity),
  );

  // Nothing new under the ceiling: the first roll stands and the pull is a
  // duplicate, exactly as it was before this rule existed.
  if (live.length === 0) return rolled;

  const total = live.reduce((sum, [, prob]) => sum + prob, 0);
  let roll = random() * total;
  for (const [rarity, prob] of live) {
    roll -= prob;
    if (roll < 0) return rarity;
  }
  // Floating-point slack on the last band only.
  return live[live.length - 1][0];
}

/**
 * One item of the drawn rarity, biased toward models the player is missing.
 *
 * Falls back to the full pool whenever the bias does not fire or the player
 * already owns everything at that rarity, so this can never fail to return.
 */
export function pickBiased<T>(
  pool: readonly T[],
  isOwned: (item: T) => boolean,
  random: () => number = Math.random,
): T {
  if (random() < NEW_ITEM_BIAS) {
    const missing = pool.filter((item) => !isOwned(item));
    if (missing.length > 0) {
      return missing[Math.floor(random() * missing.length)];
    }
  }
  return pool[Math.floor(random() * pool.length)];
}
