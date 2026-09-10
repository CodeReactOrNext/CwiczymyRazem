import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectLevel } from "feature/arsenal/data/effectStats";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import {
  rarityLockLvl,
  usePlayerLvl,
} from "feature/progression/hooks/usePlayerLvl";
import type { ReactNode } from "react";

import type { EffectInventoryItem } from "../../types/arsenal.types";
import type { StashPlacement } from "../Collection/StashTile";
import { StashTile } from "../Collection/StashTile";
import { RARITY_STYLES } from "../RarityBadge";
import { EffectCard } from "./EffectCard";

interface EffectStashTileProps extends StashPlacement {
  item: EffectInventoryItem;
  isOnPedalboard?: boolean;
  /** Under the hover card — see `StashTile`. */
  previewFooter?: ReactNode;
  onClick?: () => void;
}

/** A pedal as one socket of the stash. Square, unlike the tall guitar sockets. */
export const EffectStashTile = ({
  item,
  isOnPedalboard = false,
  previewFooter,
  onClick,
  ...placement
}: EffectStashTileProps) => {
  const playerLvl = usePlayerLvl();

  const effect = EFFECTS_BY_ID.get(item.effectId);
  if (!effect) return null;

  const rarity = getEffectiveRarity(effect.rarity, item.buildLevel);
  const lockedLvl = rarityLockLvl(rarity, playerLvl, isOnPedalboard);

  return (
    <StashTile
      {...placement}
      color={RARITY_STYLES[rarity].baseColor}
      imageSrc={getEffectImageSrc(effect.imageId, "small")}
      // The cap goes in the label as well as the corner: the padlock is the
      // only part of a socket a screen reader cannot see.
      label={`${effect.brand} ${effect.name} — ${rarity}${
        lockedLvl != null ? ` — needs level ${lockedLvl}` : ""
      }`}
      level={getEffectLevel(item, effect)}
      isNew={item.isNew}
      locked={lockedLvl != null}
      inUse={isOnPedalboard}
      onClick={onClick}
      preview={
        <EffectCard item={item} isOnPedalboard={isOnPedalboard} readOnly />
      }
      previewFooter={previewFooter}
    />
  );
};
