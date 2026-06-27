import type { GuitarRarity } from "../types/arsenal.types";
import { RARITY_STYLES } from "./RarityBadge";

/** Highest rarity first — used for both sorting and section display order. */
export const RARITY_ORDER: GuitarRarity[] = [
  "Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common",
];

/** Higher number = rarer. Used as the primary sort key for collections. */
export const RARITY_RANK: Record<GuitarRarity, number> = {
  Mythic: 6, Legendary: 5, Epic: 4, Rare: 3, Uncommon: 2, Common: 1,
};

interface RaritySectionHeaderProps {
  rarity: GuitarRarity;
  owned: number;
  total: number;
}

/** Heading + progress bar shown above each rarity's group of cards. */
export const RaritySectionHeader = ({ rarity, owned, total }: RaritySectionHeaderProps) => {
  const color = RARITY_STYLES[rarity].baseColor;
  const pct = total === 0 ? 0 : Math.round((owned / total) * 100);

  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        className="text-sm font-black capitalize tracking-wider"
        style={{ color }}
      >
        {rarity}
      </span>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-bold text-zinc-400">
        {owned}
        <span className="text-zinc-600">/{total}</span>
      </span>
    </div>
  );
};
