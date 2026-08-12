import type { ArsenalUserData } from "../types/arsenal.types";

/**
 * Where a piece of gear is currently in service.
 *
 * Three different things in the data model — the profile guitar, the rig slots
 * and the pedalboard — but one question for the player: am I actually using
 * this? Every part of the arsenal that has to answer it reads this, so "in use"
 * cannot come to mean one thing on a card and another in the workshop.
 */
export type ItemUse =
  | { where: "profile" }
  | { where: "rig"; slot: number }
  | { where: "board" };

/** Everything the given item is doing right now. Empty = spare. */
export const getItemUses = (
  data: Pick<ArsenalUserData, "equippedItemId" | "rig"> | null | undefined,
  itemId: string,
): ItemUse[] => {
  if (!data) return [];

  const uses: ItemUse[] = [];
  if (data.equippedItemId === itemId) uses.push({ where: "profile" });

  // A guitar can be on the profile *and* in a rig slot: the profile is what
  // other players see, the rig is what gets ranked. Both are worth saying.
  const slot = (data.rig?.guitarSlots ?? []).indexOf(itemId);
  if (slot >= 0) uses.push({ where: "rig", slot });

  if ((data.rig?.pedalboardItems ?? []).some((p) => p.itemId === itemId))
    uses.push({ where: "board" });

  return uses;
};

/**
 * The guitars the player is actually playing: the one on the profile plus
 * whatever is loaded into the rig.
 *
 * Both collection views and the bulk sell agree on this, so "in use" means one
 * thing — an order that lifted a guitar the bulk sell would happily part with
 * would be lying about which copy matters.
 */
export const getInUseGuitarIds = (
  equippedItemId: string | null | undefined,
  rigSlots: readonly (string | null)[] = [],
): Set<string> => {
  const ids = new Set<string>();
  if (equippedItemId) ids.add(equippedItemId);
  for (const id of rigSlots) if (id) ids.add(id);
  return ids;
};
