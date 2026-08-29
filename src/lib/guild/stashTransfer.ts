import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import {
  getPartLabel,
  PART_TIERS,
  PARTS_BY_ID,
} from "feature/arsenal/data/partDefinitions";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import { getModDef, subtractParts } from "feature/arsenal/data/workshop";
import type {
  PartId,
  PartTier,
  SalvagedMod,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import { addPartsToWallet } from "feature/arsenal/utils/scrap";

/**
 * Moving one gear instance between a player's inventory and somewhere else.
 *
 * Taking a guitar out is not one field: it leaves the inventory array, may free
 * the equipped slot and a rig slot, and the rig level has to be recomputed from
 * what is left — miss any of those and the player keeps the Fame rate of an
 * instrument they no longer own. `marketplace/list-item` already does all of
 * this inline for its own escrow; this is the same sequence, pulled out so the
 * guild stash cannot drift from it. Folding the marketplace onto this helper is
 * the obvious follow-up, deliberately not done in the same change as adding a
 * new way to move items.
 */

export type GearKind = "guitar" | "effect";

export interface DetachedItem {
  item: Record<string, any>;
  name: string;
  brand: string;
  rarity: string;
  imageId: number | string;
  /** Field updates that take the instance off the owner. */
  userUpdate: Record<string, any>;
}

export type DetachProblem =
  | "not-found"
  | "no-definition"
  | "on-pedalboard"
  | "not-enough"
  | null;

/**
 * A stack of parts or a rescued mod on its way out of a wallet.
 *
 * The same shape as a detached instance minus the things only an instance has:
 * a part has no brand and a mod has no picture of its own, and neither carries
 * a rarity in the sense a guitar does — a part’s tier stands in for one.
 */
export interface DetachedLoose {
  item: Record<string, any>;
  name: string;
  rarity: string;
  userUpdate: Record<string, any>;
}

/** Removes an instance from its owner, leaving the rig consistent. */
export const detachItem = (
  data: Record<string, any>,
  kind: GearKind,
  inventoryItemId: string,
):
  | { ok: true; detached: DetachedItem }
  | { ok: false; problem: DetachProblem } => {
  const invKey = kind === "guitar" ? "inventory" : "effectInventory";
  const inventory: any[] = data.arsenal?.[invKey] || [];
  const index = inventory.findIndex((entry) => entry.id === inventoryItemId);
  if (index === -1) return { ok: false, problem: "not-found" };

  const item = inventory[index];
  const userUpdate: Record<string, any> = {};

  let def:
    | { name: string; brand: string; rarity: string; imageId: number | string }
    | undefined;

  if (kind === "guitar") {
    def = GUITARS_BY_ID.get(item.guitarId);
  } else {
    def = EFFECTS_BY_ID.get(item.effectId);
    // A pedal that is wired into the board cannot leave it — same rule the
    // marketplace and sell-effect both hold.
    const pedalboardItems: any[] = data.arsenal?.rig?.pedalboardItems || [];
    if (pedalboardItems.some((placed) => placed.itemId === inventoryItemId)) {
      return { ok: false, problem: "on-pedalboard" };
    }
  }
  if (!def) return { ok: false, problem: "no-definition" };

  const remaining = inventory.filter((_, i) => i !== index);
  userUpdate[`arsenal.${invKey}`] = remaining;

  const rig = data.arsenal?.rig ?? DEFAULT_RIG;
  let postRig = rig;

  if (kind === "guitar") {
    const equippedItemId = data.arsenal?.equippedItemId ?? null;
    const equippedGuitarId = data.arsenal?.equippedGuitarId ?? null;
    const wasEquipped = equippedItemId
      ? equippedItemId === item.id
      : equippedGuitarId === item.guitarId;
    if (wasEquipped) {
      userUpdate["arsenal.equippedGuitarId"] = null;
      userUpdate["arsenal.equippedItemId"] = null;
    }

    const guitarSlots = (rig.guitarSlots ?? DEFAULT_RIG.guitarSlots).map(
      (slotId: string | null) => (slotId === item.id ? null : slotId),
    );
    postRig = { ...rig, guitarSlots };
    userUpdate["arsenal.rig.guitarSlots"] = guitarSlots;
  }

  userUpdate.rigLevel = getRigLevel({
    rig: postRig,
    inventory: kind === "guitar" ? remaining : data.arsenal?.inventory || [],
    effectInventory:
      kind === "effect" ? remaining : data.arsenal?.effectInventory || [],
  });

  return {
    ok: true,
    detached: {
      item,
      name: def.name,
      brand: def.brand,
      rarity: def.rarity,
      imageId: def.imageId,
      userUpdate,
    },
  };
};

/**
 * Puts an instance into a player's inventory, flagged new so it surfaces the
 * way a fresh pull does, and marks the model discovered in their Dex.
 */
export const attachItem = (
  data: Record<string, any>,
  kind: GearKind,
  item: Record<string, any>,
): Record<string, any> => {
  const invKey = kind === "guitar" ? "inventory" : "effectInventory";
  const dexKey = kind === "guitar" ? "dexGuitars" : "dexEffects";
  const definitionId = kind === "guitar" ? item.guitarId : item.effectId;

  const inventory: any[] = data.arsenal?.[invKey] || [];
  const dex: (number | string)[] = data.arsenal?.[dexKey] || [];

  return {
    [`arsenal.${invKey}`]: [
      ...inventory,
      { ...item, isNew: true, acquiredAt: Date.now() },
    ],
    [`arsenal.${dexKey}`]: dex.includes(definitionId)
      ? dex
      : [...dex, definitionId],
  };
};

// ─── Parts: a currency, so what moves is an amount ───────────────────────────

/**
 * Takes `qty` pieces of one (part, tier) stack off the owner's wallet.
 *
 * Parts stack rather than existing as instances, so unlike gear the caller has
 * to say how many — and the holding is counted here rather than trusted from
 * the request, the same way `sell-part` counts it before paying out.
 */
export const detachPart = (
  data: Record<string, any>,
  partId: PartId,
  tier: PartTier,
  qty: number,
):
  | { ok: true; detached: DetachedLoose }
  | { ok: false; problem: DetachProblem } => {
  if (!PARTS_BY_ID.has(partId) || !PART_TIERS.includes(tier)) {
    return { ok: false, problem: "no-definition" };
  }

  const wanted = Math.floor(Number(qty));
  if (!Number.isFinite(wanted) || wanted <= 0) {
    return { ok: false, problem: "not-found" };
  }

  const wallet: ScrapPart[] = data.arsenal?.parts || [];
  const held = wallet
    .filter((part) => part.partId === partId && part.tier === tier)
    .reduce((total, part) => total + part.qty, 0);
  if (held < wanted) return { ok: false, problem: "not-enough" };

  return {
    ok: true,
    detached: {
      item: { partId, tier, qty: wanted },
      name: `${tier} ${getPartLabel(partId)}`,
      rarity: tier,
      userUpdate: {
        "arsenal.parts": subtractParts(wallet, [{ partId, tier, qty: wanted }]),
      },
    },
  };
};

/** Merges a stack into the taker's wallet, where it stacks by (part, tier). */
export const attachPart = (
  data: Record<string, any>,
  part: ScrapPart,
): Record<string, any> => ({
  "arsenal.parts": addPartsToWallet(data.arsenal?.parts || [], [part]),
});

// ─── Mods: things, one entry each ────────────────────────────────────────────

/** Takes one rescued mod out of the owner's stash. */
export const detachMod = (
  data: Record<string, any>,
  modId: string,
):
  | { ok: true; detached: DetachedLoose }
  | { ok: false; problem: DetachProblem } => {
  const mods: SalvagedMod[] = data.arsenal?.salvagedMods || [];
  const mod = mods.find((entry) => entry.id === modId);
  if (!mod) return { ok: false, problem: "not-found" };

  const def = getModDef(mod.kind, mod.featureId);
  if (!def) return { ok: false, problem: "no-definition" };

  return {
    ok: true,
    detached: {
      item: mod,
      name: `${def.label} +${mod.points}`,
      // A mod has no rarity of its own, and the points it carries are what a
      // member reading the log actually wants to know.
      rarity: `+${mod.points}`,
      userUpdate: {
        "arsenal.salvagedMods": mods.filter((entry) => entry.id !== modId),
      },
    },
  };
};

/**
 * Puts a rescued mod into a player's stash.
 *
 * A mod's id is derived from the instrument it came off, which makes it unique
 * within one account but says nothing about another's — and a stash holding two
 * entries under the same id would lose one the first time either was fitted. So
 * a clash is re-issued rather than trusted.
 */
export const attachMod = (
  data: Record<string, any>,
  mod: SalvagedMod,
): Record<string, any> => {
  const mods: SalvagedMod[] = data.arsenal?.salvagedMods || [];
  const taken = mods.some((entry) => entry.id === mod.id);
  const id = taken ? `${mod.id}-${Date.now().toString(36)}` : mod.id;

  return { "arsenal.salvagedMods": [...mods, { ...mod, id }] };
};
