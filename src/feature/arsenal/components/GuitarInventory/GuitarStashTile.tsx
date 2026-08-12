import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import {
  getEffectiveRarity,
  getItemLevel,
} from "feature/arsenal/data/itemStats";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";

import type { InventoryItem } from "../../types/arsenal.types";
import type { StashPlacement } from "../Collection/StashTile";
import { StashTile } from "../Collection/StashTile";
import { RARITY_STYLES } from "../RarityBadge";
import { GuitarCard } from "./GuitarCard";

interface GuitarStashTileProps extends StashPlacement {
  item: InventoryItem;
  isEquipped?: boolean;
  /** Rig slot index (0-2) this copy occupies, or null. */
  rigSlot?: number | null;
  onClick: () => void;
}

/** A guitar in the stash: two sockets tall, art stood upright, like a big weapon. */
export const GuitarStashTile = ({
  item,
  isEquipped = false,
  rigSlot = null,
  onClick,
  ...placement
}: GuitarStashTileProps) => {
  const guitar = GUITARS_BY_ID.get(item.guitarId);
  if (!guitar) return null;

  const rarity = getEffectiveRarity(guitar.rarity, item.buildLevel);

  return (
    <StashTile
      {...placement}
      color={RARITY_STYLES[rarity].baseColor}
      imageSrc={getRankBadgeSrc(guitar.imageId, "medium")}
      imageRotated
      tall
      label={`${guitar.brand} ${guitar.name} — ${rarity}`}
      level={getItemLevel(item, guitar)}
      isNew={item.isNew}
      inUse={isEquipped || rigSlot != null}
      onClick={onClick}
      preview={<GuitarCard item={item} isEquipped={isEquipped} readOnly />}
    />
  );
};
