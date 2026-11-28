import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import { type RackLookId, readBoardSkins, wornRackLooks } from "feature/arsenal/data/boardSkins";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getEffectiveRarity, getItemLevel } from "feature/arsenal/data/itemStats";
import { useArsenalData } from "feature/arsenal/hooks/useArsenalData";
import type { ArsenalUserData, GuitarDefinition, InventoryItem } from "feature/arsenal/types/arsenal.types";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { useMemo } from "react";

/** As many as the Rig's guitar wall holds. */
export const STAGE_GUITARS_MAX = 3;

export interface StageGuitar {
  key: string;
  src: string;
  name: string;
  /** The rarity's colour: its case's lamp is tinted with it, as in the Rig. */
  color: string;
  /** The display case the player put in that bay of their Rig; none — the studio's own. */
  look?: RackLookId;
}

/**
 * The player's own guitars for the studio wall: the ones hanging on their Rig,
 * in its order; with an empty Rig, their best ones. Pure, for the tests.
 */
export function pickStageGuitars(
  data: Pick<ArsenalUserData, "inventory" | "rig" | "boardSkins"> | undefined,
): StageGuitar[] {
  if (!data) return [];
  const known = (item: InventoryItem | undefined): item is InventoryItem =>
    // get(), not has(): a Builder build resolves too, with its own render.
    !!item && !!GUITARS_BY_ID.get(item.guitarId);
  const byId = new Map(data.inventory.map((item) => [item.id, item]));

  // Each Rig bay keeps its own case, so a guitar takes the case of the bay it hangs in.
  const looks = wornRackLooks(readBoardSkins(data.boardSkins));
  let hung = (data.rig?.guitarSlots ?? [])
    .map((id, bay) => ({ item: id ? byId.get(id) : undefined, look: looks[bay] }))
    .filter((entry): entry is { item: InventoryItem; look: RackLookId | undefined } => known(entry.item));
  if (hung.length === 0) {
    hung = data.inventory
      .filter(known)
      .map((item) => ({ item, level: getItemLevel(item, GUITARS_BY_ID.get(item.guitarId) as GuitarDefinition) }))
      .sort((a, b) => b.level - a.level)
      .map(({ item }) => ({ item, look: undefined }));
  }

  return hung.slice(0, STAGE_GUITARS_MAX).map(({ item, look }) => {
    const guitar = GUITARS_BY_ID.get(item.guitarId) as GuitarDefinition;
    const rarity = getEffectiveRarity(guitar.rarity, item.buildLevel);
    return {
      key: item.id,
      src: getRankBadgeSrc(guitar.imageId, "large"),
      name: guitar.name,
      color: RARITY_STYLES[rarity]?.baseColor ?? RARITY_STYLES.Common.baseColor,
      look,
    };
  });
}

/** The player's guitars for the stage; fetched only while the stage is open. */
export function useStageGuitars(enabled: boolean): StageGuitar[] {
  const { data } = useArsenalData(enabled);
  return useMemo(() => pickStageGuitars(data), [data]);
}
