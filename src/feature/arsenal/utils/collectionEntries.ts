import { EFFECTS_BY_ID } from "../data/effectDefinitions";
import { getEffectLevel } from "../data/effectStats";
import { GUITARS_BY_ID } from "../data/guitarDefinitions";
import { getEffectiveRarity, getItemLevel } from "../data/itemStats";
import type {
  EffectInventoryItem,
  InventoryItem,
} from "../types/arsenal.types";
import type { CollectionEntry } from "./collectionFilter";

/**
 * What the toolbar searches and sorts by. Kept next to the filter it feeds so
 * the stash and the card grid can never disagree about the order of the same
 * two items — they read the same description of them.
 *
 * `inUseIds` is what `equipped` order sorts on; leave it out where nothing is
 * equipped and every entry simply counts as spare.
 */
export const getGuitarEntries = (
  inventory: InventoryItem[],
  inUseIds?: ReadonlySet<string>,
): CollectionEntry<InventoryItem>[] =>
  inventory.map((item) => {
    const guitar = GUITARS_BY_ID.get(item.guitarId);
    return {
      item,
      name: guitar ? `${guitar.brand} ${guitar.name}` : "",
      // Effective, not mint: a promoted guitar belongs with its new tier.
      rarity: getEffectiveRarity(guitar?.rarity ?? "Common", item.buildLevel),
      level: guitar ? getItemLevel(item, guitar) : 0,
      acquiredAt: item.acquiredAt,
      groupKey: String(item.guitarId),
      inUse: inUseIds?.has(item.id) ?? false,
    };
  });

export const getEffectEntries = (
  effectInventory: EffectInventoryItem[],
  inUseIds?: ReadonlySet<string>,
): CollectionEntry<EffectInventoryItem>[] =>
  effectInventory.map((item) => {
    const effect = EFFECTS_BY_ID.get(item.effectId);
    return {
      item,
      name: effect ? `${effect.brand} ${effect.name}` : "",
      rarity: getEffectiveRarity(effect?.rarity ?? "Common", item.buildLevel),
      level: effect ? getEffectLevel(item, effect) : 0,
      acquiredAt: item.acquiredAt,
      groupKey: String(item.effectId),
      inUse: inUseIds?.has(item.id) ?? false,
    };
  });
