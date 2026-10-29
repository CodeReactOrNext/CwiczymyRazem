import type { ArsenalRarity } from "feature/landing/lib/arsenalProps";

/**
 * The Arsenal's rarity colours (RARITY_STYLES.baseColor in
 * feature/arsenal/components/RarityBadge), copied so the landing does not pull
 * in the badge's translation hook. Colour here means rarity and nothing else.
 */
export const RARITY_COLOR: Record<ArsenalRarity, string> = {
  Common: "#a1a1aa",
  Uncommon: "#10b981",
  Rare: "#3b82f6",
  Epic: "#a855f7",
  Legendary: "#f43f5e",
  Mythic: "#fbbf24",
};
