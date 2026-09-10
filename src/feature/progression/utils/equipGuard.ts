import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getEffectiveRarity } from "feature/arsenal/data/itemStats";
import type {
  EffectInventoryItem,
  GuitarRarity,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";

import { canEquipRarity, RARITY_UNLOCK_LVL } from "../data/rarityCap";

/**
 * A refusal, with everything the screen needs to explain it.
 *
 * "Too rare" on its own is unanswerable — the player is holding an instrument
 * the game gave them and being told no. So the refusal carries what it was, and
 * the level that would let it in.
 */
export interface BlockedEquip {
  itemId: string;
  name: string;
  rarity: GuitarRarity;
  requiredLvl: number;
}

/** What a guitar counts as for the cap: mint rarity, promoted by the bench. */
export const guitarEquipRarity = (
  item: Pick<InventoryItem, "guitarId" | "buildLevel">,
): GuitarRarity | null => {
  const def = GUITARS_BY_ID.get(item.guitarId);
  return def ? getEffectiveRarity(def.rarity, item.buildLevel) : null;
};

/** The same for a pedal. */
export const effectEquipRarity = (
  item: Pick<EffectInventoryItem, "effectId" | "buildLevel">,
): GuitarRarity | null => {
  const def = EFFECTS_BY_ID.get(item.effectId);
  return def ? getEffectiveRarity(def.rarity, item.buildLevel) : null;
};

const guitarName = (item: Pick<InventoryItem, "guitarId">): string =>
  GUITARS_BY_ID.get(item.guitarId)?.name ?? "This guitar";

const effectName = (item: Pick<EffectInventoryItem, "effectId">): string =>
  EFFECTS_BY_ID.get(item.effectId)?.name ?? "This pedal";

const block = (
  itemId: string,
  name: string,
  rarity: GuitarRarity,
): BlockedEquip => ({
  itemId,
  name,
  rarity,
  requiredLvl: RARITY_UNLOCK_LVL[rarity] ?? 1,
});

/** Why one guitar cannot go in, or null if it can. */
export const checkGuitarEquip = (
  item: Pick<InventoryItem, "id" | "guitarId" | "buildLevel">,
  lvl: number,
): BlockedEquip | null => {
  const rarity = guitarEquipRarity(item);
  // An instrument the catalogue has forgotten is not the player's problem, and
  // refusing it would strand whatever is already in the slot.
  if (!rarity || canEquipRarity(rarity, lvl)) return null;
  return block(item.id, guitarName(item), rarity);
};

/** Why one pedal cannot go on the board, or null if it can. */
export const checkEffectEquip = (
  item: Pick<EffectInventoryItem, "id" | "effectId" | "buildLevel">,
  lvl: number,
): BlockedEquip | null => {
  const rarity = effectEquipRarity(item);
  if (!rarity || canEquipRarity(rarity, lvl)) return null;
  return block(item.id, effectName(item), rarity);
};

/**
 * The first item a rig change would newly bring in over the cap.
 *
 * **Only what is newly brought in.** Anything already standing in a slot or on
 * the board stays there whatever the level — the ladder shipped years after
 * some of these rigs were built, and stripping somebody's Mythic out of a rig
 * they earned before the rule existed would be a punishment for having played
 * early. Which means a player who slips below a threshold cannot happen, and a
 * player who takes a capped item out cannot put it back until they climb.
 *
 * Guitars and pedals are checked together because they are equipped through the
 * same door — `update-rig` writes both halves of the rig in one call, and a cap
 * that only watched the guitar half would be a cap in name only.
 */
export const findBlockedRigChange = (
  // Taken at its loosest shape — the guard reads ids, a guitarId, an effectId
  // and a build level, and nothing else. A real `ArsenalUserData` fits, and so
  // does a half-built rig off a legacy document.
  arsenal: {
    inventory?: Pick<InventoryItem, "id" | "guitarId" | "buildLevel">[];
    effectInventory?: Pick<
      EffectInventoryItem,
      "id" | "effectId" | "buildLevel"
    >[];
    rig?: {
      guitarSlots?: (string | null)[];
      pedalboardItems?: { itemId: string }[];
    } | null;
  },
  next: {
    guitarSlots?: (string | null)[];
    pedalboardItemIds?: string[];
  },
  lvl: number,
): BlockedEquip | null => {
  const currentSlots: (string | null)[] = arsenal.rig?.guitarSlots ?? [];
  const currentBoard = arsenal.rig?.pedalboardItems ?? [];

  const alreadyIn = new Set<string>([
    ...currentSlots.filter((id): id is string => typeof id === "string"),
    ...currentBoard.map((placement) => placement.itemId),
  ]);

  for (const slotId of next.guitarSlots ?? []) {
    if (!slotId || alreadyIn.has(slotId)) continue;
    const item = arsenal.inventory?.find((entry) => entry.id === slotId);
    const blocked = item ? checkGuitarEquip(item, lvl) : null;
    if (blocked) return blocked;
  }

  for (const itemId of next.pedalboardItemIds ?? []) {
    if (!itemId || alreadyIn.has(itemId)) continue;
    const item = arsenal.effectInventory?.find((entry) => entry.id === itemId);
    const blocked = item ? checkEffectEquip(item, lvl) : null;
    if (blocked) return blocked;
  }

  return null;
};

/** The refusal, worded for the player. */
export const blockedEquipMessage = (blocked: BlockedEquip): string =>
  `${blocked.name} is ${blocked.rarity} — reach level ${blocked.requiredLvl} to put it in your rig. It stays in your stash until then.`;
