import type { DuplicateItem } from "../components/GuitarInventory/BulkDuplicatesDialog";
import { EFFECTS_BY_ID } from "../data/effectDefinitions";
import { getEffectLevel, getEffectValue } from "../data/effectStats";
import { GUITARS_BY_ID } from "../data/guitarDefinitions";
import {
  getEffectiveRarity,
  getItemLevel,
  getItemValue,
} from "../data/itemStats";
import { getSalvageableMod } from "../data/salvage";
import { mergeScrapParts } from "../data/scrapYield";
import type {
  EffectInventoryItem,
  InventoryItem,
  ScrapPart,
} from "../types/arsenal.types";
import {
  countScrapParts,
  getEffectScrapYield,
  getGuitarScrapYield,
} from "./scrap";

export interface DuplicateSummary {
  /** Inventory ids the bulk action would take. */
  ids: string[];
  /** What the confirm dialog lists, most valuable first. */
  items: DuplicateItem[];
  /** Fame the whole batch pays out if it is sold. */
  fame: number;
  /** Merged teardown yield if the same batch is scrapped instead. */
  parts: ScrapPart[];
  /** Total pieces in `parts` — the headline on the scrap option. */
  partCount: number;
  /** How many fitted mods a teardown would pull out whole into the stash. */
  salvagedCount: number;
}

const emptySummary = (): DuplicateSummary => ({
  ids: [],
  items: [],
  fame: 0,
  parts: [],
  partCount: 0,
  salvagedCount: 0,
});

/**
 * For every model owned more than once, keep the best copy and offer the rest.
 *
 * Both collection views put the same button in their header, so the rule that
 * decides what "the rest" means — and what is protected from it — lives here
 * rather than being written out twice.
 *
 * The batch is priced both ways: the dialog offers selling it for Fame or
 * scrapping it for parts, and the same set of copies goes either way.
 */
export const getGuitarDuplicates = (
  inventory: InventoryItem[],
  {
    equippedItemId,
    rigSlots,
  }: { equippedItemId: string | null; rigSlots: (string | null)[] },
): DuplicateSummary => {
  const byGuitar = new Map<number | string, InventoryItem[]>();
  for (const item of inventory) {
    const group = byGuitar.get(item.guitarId);
    if (group) group.push(item);
    else byGuitar.set(item.guitarId, [item]);
  }

  const result = emptySummary();
  const yields: ScrapPart[][] = [];
  for (const [guitarId, group] of byGuitar) {
    if (group.length < 2) continue;
    const guitar = GUITARS_BY_ID.get(guitarId);
    if (!guitar) continue;
    // Best copy first (level desc, value as tie-break); keep it, take the rest.
    const sorted = [...group].sort(
      (a, b) =>
        getItemLevel(b, guitar) - getItemLevel(a, guitar) ||
        getItemValue(b, guitar) - getItemValue(a, guitar),
    );
    for (let i = 1; i < sorted.length; i++) {
      const item = sorted[i];
      if (item.id === equippedItemId) continue;
      if (rigSlots.includes(item.id)) continue;
      const value = getItemValue(item, guitar);
      result.ids.push(item.id);
      result.items.push({
        id: item.id,
        name: `${guitar.brand} ${guitar.name}`,
        rarity: getEffectiveRarity(guitar.rarity, item.buildLevel),
        level: getItemLevel(item, guitar),
        value,
      });
      result.fame += value;
      yields.push(getGuitarScrapYield(item, guitar));
      if (getSalvageableMod(item, "guitar")) result.salvagedCount += 1;
    }
  }

  // Highest-level (most valuable) first so the biggest losses are visible up top.
  result.items.sort((a, b) => b.level - a.level || b.value - a.value);
  result.parts = mergeScrapParts(yields);
  result.partCount = countScrapParts(result.parts);
  return result;
};

/** Same rule for pedals; pedals on the pedalboard are the protected ones. */
export const getEffectDuplicates = (
  effectInventory: EffectInventoryItem[],
  pedalboardItemIds: Set<string>,
): DuplicateSummary => {
  const byEffect = new Map<number | string, EffectInventoryItem[]>();
  for (const item of effectInventory) {
    const group = byEffect.get(item.effectId);
    if (group) group.push(item);
    else byEffect.set(item.effectId, [item]);
  }

  const result = emptySummary();
  const yields: ScrapPart[][] = [];
  for (const [effectId, group] of byEffect) {
    if (group.length < 2) continue;
    const effect = EFFECTS_BY_ID.get(effectId);
    if (!effect) continue;
    const value = getEffectValue(effect); // rarity-based, same for every copy
    const sorted = [...group].sort(
      (a, b) => getEffectLevel(b, effect) - getEffectLevel(a, effect),
    );
    for (let i = 1; i < sorted.length; i++) {
      const item = sorted[i];
      if (pedalboardItemIds.has(item.id)) continue;
      result.ids.push(item.id);
      result.items.push({
        id: item.id,
        name: `${effect.brand} ${effect.name}`,
        rarity: getEffectiveRarity(effect.rarity, item.buildLevel),
        level: getEffectLevel(item, effect),
        value,
      });
      result.fame += value;
      yields.push(getEffectScrapYield(item, effect));
      if (getSalvageableMod(item, "effect")) result.salvagedCount += 1;
    }
  }

  result.items.sort((a, b) => b.level - a.level || b.value - a.value);
  result.parts = mergeScrapParts(yields);
  result.partCount = countScrapParts(result.parts);
  return result;
};
