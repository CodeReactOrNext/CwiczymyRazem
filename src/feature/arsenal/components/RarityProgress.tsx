import type { GuitarRarity } from "../types/arsenal.types";

/** Highest rarity first — used for both sorting and section display order. */
export const RARITY_ORDER: GuitarRarity[] = [
  "Custom Shop", "Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common",
];

/** Higher number = rarer. Used as the primary sort key for collections. */
export const RARITY_RANK: Record<GuitarRarity, number> = {
  "Custom Shop": 7, Mythic: 6, Legendary: 5, Epic: 4, Rare: 3, Uncommon: 2, Common: 1,
};

