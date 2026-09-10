import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import {
  getEffectiveRarity,
  getItemLevel,
} from "feature/arsenal/data/itemStats";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import {
  rarityLockLvl,
  usePlayerLvl,
} from "feature/progression/hooks/usePlayerLvl";
import type { ReactNode } from "react";

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
  /** Under the hover card — see `StashTile`. */
  previewFooter?: ReactNode;
  onClick?: () => void;
}

/** A guitar in the stash: two sockets tall, art stood upright, like a big weapon. */
export const GuitarStashTile = ({
  item,
  isEquipped = false,
  rigSlot = null,
  previewFooter,
  onClick,
  ...placement
}: GuitarStashTileProps) => {
  const playerLvl = usePlayerLvl();

  const guitar = GUITARS_BY_ID.get(item.guitarId);
  if (!guitar) return null;

  const rarity = getEffectiveRarity(guitar.rarity, item.buildLevel);
  const inUse = isEquipped || rigSlot != null;
  const lockedLvl = rarityLockLvl(rarity, playerLvl, inUse);

  return (
    <StashTile
      {...placement}
      color={RARITY_STYLES[rarity].baseColor}
      imageSrc={getRankBadgeSrc(guitar.imageId, "medium")}
      imageRotated
      tall
      // The cap goes in the label as well as the corner: the padlock is the
      // only part of a socket a screen reader cannot see.
      label={`${guitar.brand} ${guitar.name} — ${rarity}${
        lockedLvl != null ? ` — needs level ${lockedLvl}` : ""
      }`}
      level={getItemLevel(item, guitar)}
      isNew={item.isNew}
      locked={lockedLvl != null}
      inUse={inUse}
      onClick={onClick}
      preview={
        <GuitarCard
          item={item}
          isEquipped={isEquipped}
          rigSlot={rigSlot}
          readOnly
        />
      }
      previewFooter={previewFooter}
    />
  );
};
