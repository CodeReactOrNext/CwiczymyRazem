import { RARITY_LADDER } from "feature/arsenal/data/itemStats";
import type { GuitarRarity } from "feature/arsenal/types/arsenal.types";

/**
 * The level an account has to reach before it can *equip* a rarity.
 *
 * Owning is never gated. A case that pays a Mythic on the first day still pays
 * it, the instrument still hangs in the stash, the Dex still records it, the
 * workshop still works on it and the market still sells it. The only thing the
 * level decides is whether it can go into the rig — which is the one place gear
 * turns into Fame per hour, and therefore the one place where handing the whole
 * ladder to a brand new account would flatten the climb everyone else made.
 *
 * The numbers come off the points curve rather than out of the air. A level
 * costs `(35 + lvl) * lvl` points and practice pays 22 an hour, so these are
 * roughly 3, 9, 18, 31 and 47 hours of playing — a ladder that lands inside the
 * first two months for somebody practising a few times a week, and well before
 * the rarities themselves show up in any quantity.
 */
export const RARITY_UNLOCK_LVL: Record<GuitarRarity, number> = {
  Common: 1,
  Uncommon: 1,
  Rare: 3,
  Epic: 6,
  Legendary: 10,
  Mythic: 15,
  "Custom Shop": 20,
};

/** Every level at which at least one new rarity opens, ascending. */
export const RARITY_UNLOCK_LEVELS: number[] = [
  ...new Set(Object.values(RARITY_UNLOCK_LVL)),
]
  .filter((lvl) => lvl > 1)
  .sort((a, b) => a - b);

/** The rarities that open at exactly `lvl`, in ladder order. */
export const getRaritiesUnlockedAt = (lvl: number): GuitarRarity[] =>
  RARITY_LADDER.filter((rarity) => RARITY_UNLOCK_LVL[rarity] === lvl);

/**
 * Whether an account at `lvl` may equip `rarity`.
 *
 * Pass the item's *effective* rarity (`getEffectiveRarity`), not the
 * catalogue's: a Rare promoted to Epic at the bench is an Epic everywhere else
 * in the game, and letting it in through the mint rarity would make the
 * workshop a way around the ladder.
 */
export const canEquipRarity = (rarity: GuitarRarity, lvl: number): boolean =>
  lvl >= (RARITY_UNLOCK_LVL[rarity] ?? 1);

/** The highest rarity `lvl` may equip. */
export const getRarityCap = (lvl: number): GuitarRarity =>
  [...RARITY_LADDER].reverse().find((rarity) => canEquipRarity(rarity, lvl)) ??
  "Common";

/** The level `rarity` opens at, or `undefined` once it already has. */
export const getRarityLockedAtLvl = (
  rarity: GuitarRarity,
  lvl: number,
): number | undefined =>
  canEquipRarity(rarity, lvl) ? undefined : RARITY_UNLOCK_LVL[rarity];
