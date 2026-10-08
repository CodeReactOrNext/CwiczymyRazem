import { getPartLabel } from "feature/arsenal/data/partDefinitions";
import type { PartId } from "feature/arsenal/types/arsenal.types";
import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";

/**
 * The Arsenal's catalogue words — rarities, pedal types, parts and their
 * grades — in the player's language.
 *
 * The data keeps them in English (they are ids as much as words: stored on
 * items, compared in code), so they are translated where they are drawn, and
 * anything a build does not know yet falls back to the English it was given.
 */
export const useArsenalLabels = () => {
  const { t } = useTranslation("arsenal");

  return useMemo(
    () => ({
      t,
      rarity: (rarity: string) => t(`labels.rarity.${rarity}`, rarity),
      effectType: (effectType: string) =>
        t(`labels.effect_type.${effectType}`, effectType),
      part: (partId: PartId) =>
        t(`labels.part.${partId}`, getPartLabel(partId)),
      partTier: (tier: string) => t(`labels.part_tier.${tier}`, tier),
      kind: (kind: "guitar" | "effect") => t(`labels.kind.${kind}`),
    }),
    [t],
  );
};
