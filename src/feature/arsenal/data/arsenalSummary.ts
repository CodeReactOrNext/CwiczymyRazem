/**
 * The flat facts about a stash that something outside the Arsenal needs to read.
 *
 * Achievement checks are the first such caller, and they must not import
 * `guitarDefinitions`/`effectDefinitions`: an item stores its model id, not its
 * rarity, so answering "does this player own a Mythic?" needs the whole
 * definition table — the same table `rigFame` deliberately keeps out of the
 * report bundle. Summarising here, where those imports are already at home,
 * keeps every check a comparison against a number.
 *
 * Everything is derived from what is *currently owned*. That is deliberate for
 * achievements, which are never revoked once granted: selling the Mythic that
 * earned the badge cannot take the badge away, so "owned now" and "has ever
 * owned" differ only in when the badge is first handed out.
 */
import type {
  ArsenalUserData,
  EffectInventoryItem,
  GuitarRarity,
  InventoryItem,
} from "../types/arsenal.types";
import { EFFECTS_BY_ID } from "./effectDefinitions";
import { GUITARS_BY_ID } from "./guitarDefinitions";
import { getConditionGrade } from "./itemStats";
import { getRigLevel } from "./rigLevel";

export interface ArsenalSummary {
  /** Equipped guitars plus powered pedals — the same number the gear board shows. */
  rigLevel: number;
  /** How many owned items carry each mint rarity, guitars and pedals together. */
  ownedByRarity: Record<GuitarRarity, number>;
  /** Owned items graded Museum. */
  museumCount: number;
  /** Distinct production countries across the stash. */
  countryCount: number;
  /** Earliest production year of any owned guitar. Null when the stash holds none. */
  oldestGuitarYear: number | null;
  /** Lowest mint number owned. Null when nothing carries a serial (legacy items). */
  bestSerial: number | null;
  /** Owned guitars plus owned pedals. */
  itemCount: number;
}

const EMPTY_RARITIES: Record<GuitarRarity, number> = {
  Common: 0,
  Uncommon: 0,
  Rare: 0,
  Epic: 0,
  Legendary: 0,
  Mythic: 0,
  "Custom Shop": 0,
};

/**
 * The rarities a case can actually drop, in ladder order.
 *
 * `Custom Shop` is left out on purpose: no case rolls it, so a badge for
 * "one of every rarity" that included it would really be a badge for finishing
 * the workshop's promotion ladder — a different achievement, gated on a
 * different mechanic.
 */
export const DROPPABLE_RARITIES: readonly GuitarRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];

export const EMPTY_ARSENAL_SUMMARY: ArsenalSummary = {
  rigLevel: 0,
  ownedByRarity: EMPTY_RARITIES,
  museumCount: 0,
  countryCount: 0,
  oldestGuitarYear: null,
  bestSerial: null,
  itemCount: 0,
};

export const summarizeArsenal = (
  arsenal: ArsenalUserData | null | undefined,
): ArsenalSummary => {
  if (!arsenal) return EMPTY_ARSENAL_SUMMARY;

  const ownedByRarity: Record<GuitarRarity, number> = { ...EMPTY_RARITIES };
  const countries = new Set<string>();
  let museumCount = 0;
  let oldestGuitarYear: number | null = null;
  let bestSerial: number | null = null;

  // Condition and serial live on the item and behave the same on both halves of
  // the stash, so the two loops share one tally step.
  const tally = (item: InventoryItem | EffectInventoryItem, rarity?: GuitarRarity) => {
    if (rarity) ownedByRarity[rarity] += 1;
    if (item.country) countries.add(item.country);
    if (
      typeof item.condition === "number" &&
      getConditionGrade(item.condition).key === "Museum"
    ) {
      museumCount += 1;
    }
    if (typeof item.serial === "number" && (bestSerial === null || item.serial < bestSerial)) {
      bestSerial = item.serial;
    }
  };

  for (const item of arsenal.inventory ?? []) {
    tally(item, GUITARS_BY_ID.get(item.guitarId)?.rarity);
    if (typeof item.year === "number" && (oldestGuitarYear === null || item.year < oldestGuitarYear)) {
      oldestGuitarYear = item.year;
    }
  }

  for (const item of arsenal.effectInventory ?? []) {
    tally(item, EFFECTS_BY_ID.get(item.effectId)?.rarity);
  }

  return {
    rigLevel: getRigLevel(arsenal),
    ownedByRarity,
    museumCount,
    countryCount: countries.size,
    oldestGuitarYear,
    bestSerial,
    itemCount: (arsenal.inventory?.length ?? 0) + (arsenal.effectInventory?.length ?? 0),
  };
};
