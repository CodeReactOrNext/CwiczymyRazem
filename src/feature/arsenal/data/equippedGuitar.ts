import type {
  ArsenalUserData,
  GuitarDefinition,
  GuitarRarity,
  InventoryItem,
} from "../types/arsenal.types";
import { GUITARS_BY_ID } from "./guitarDefinitions";
import { getEffectiveRarity } from "./itemStats";

/**
 * The guitar the player wears on their profile, as the inventory item.
 *
 * The item is the only form that knows what the workshop has done to it —
 * promoted rarity, level, traits. Looking the guitar up in the catalogue by its
 * picture instead gives back whatever it was at mint, which is how a promoted
 * guitar ends up introducing itself as Epic long after it became Legendary.
 */
export const findEquippedGuitar = (
  arsenal: Partial<ArsenalUserData> | null | undefined,
): InventoryItem | null => {
  const inventory = arsenal?.inventory;
  if (!inventory?.length) return null;

  const byItemId = arsenal?.equippedItemId
    ? inventory.find((item) => item.id === arsenal.equippedItemId)
    : undefined;
  if (byItemId) return byItemId;

  // Guitars equipped before the unique item id was stored left only a guitarId,
  // which cannot tell duplicates apart — the first copy is the best guess left.
  return arsenal?.equippedGuitarId != null
    ? (inventory.find((item) => item.guitarId === arsenal.equippedGuitarId) ??
        null)
    : null;
};

/**
 * What the equipped guitar's rarity actually is: the catalogue's mint rarity,
 * promoted by whatever the workshop has built into the item.
 *
 * The definition is passed in because the pages showing an equipped guitar find
 * it by image id — `selectedGuitar` is all they are given. A build level only
 * promotes its own guitar: while the arsenal read is in flight, or after an
 * equip it has not caught up with, the item on hand can belong to a different
 * one.
 */
export const getEquippedRarity = (
  item: InventoryItem | null,
  definition: GuitarDefinition | null | undefined,
): GuitarRarity | null => {
  if (!definition) return null;
  const isSameGuitar =
    item != null &&
    GUITARS_BY_ID.get(item.guitarId)?.imageId === definition.imageId;
  return getEffectiveRarity(
    definition.rarity,
    isSameGuitar ? item.buildLevel : undefined,
  );
};
