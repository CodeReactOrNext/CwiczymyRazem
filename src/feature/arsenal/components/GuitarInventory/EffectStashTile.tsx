import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectLevel } from "feature/arsenal/data/effectStats";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";

import type { EffectInventoryItem } from "../../types/arsenal.types";
import type { StashPlacement } from "../Collection/StashTile";
import { StashTile } from "../Collection/StashTile";
import { RARITY_STYLES } from "../RarityBadge";
import { EffectCard } from "./EffectCard";

interface EffectStashTileProps extends StashPlacement {
  item: EffectInventoryItem;
  isOnPedalboard?: boolean;
  onClick?: () => void;
}

/** A pedal as one socket of the stash. Square, unlike the tall guitar sockets. */
export const EffectStashTile = ({
  item,
  isOnPedalboard = false,
  onClick,
  ...placement
}: EffectStashTileProps) => {
  const effect = EFFECTS_BY_ID.get(item.effectId);
  if (!effect) return null;

  const rarity = getEffectiveRarity(effect.rarity, item.buildLevel);

  return (
    <StashTile
      {...placement}
      color={RARITY_STYLES[rarity].baseColor}
      imageSrc={getEffectImageSrc(effect.imageId, "small")}
      label={`${effect.brand} ${effect.name} — ${rarity}`}
      level={getEffectLevel(item, effect)}
      isNew={item.isNew}
      inUse={isOnPedalboard}
      onClick={onClick}
      preview={
        <EffectCard item={item} isOnPedalboard={isOnPedalboard} readOnly />
      }
    />
  );
};
