import type { ArsenalUserData } from "../types/arsenal.types";
import { EFFECTS_BY_ID } from "./effectDefinitions";
import { getEffectLevel } from "./effectStats";
import { GUITARS_BY_ID } from "./guitarDefinitions";
import { getItemLevel } from "./itemStats";

/** Total rig level = levels of equipped guitars (slots) + pedalboard effects. */
export const getRigLevel = (
  arsenal: Pick<ArsenalUserData, "rig" | "inventory" | "effectInventory"> | null | undefined
): number => {
  if (!arsenal) return 0;
  let total = 0;

  for (const slotId of arsenal.rig?.guitarSlots ?? []) {
    if (!slotId) continue;
    const item = arsenal.inventory?.find((i) => i.id === slotId);
    const def = item ? GUITARS_BY_ID.get(item.guitarId) : null;
    if (item && def) total += getItemLevel(item, def);
  }

  for (const placement of arsenal.rig?.pedalboardItems ?? []) {
    const item = arsenal.effectInventory?.find((e) => e.id === placement.itemId);
    const def = item ? EFFECTS_BY_ID.get(item.effectId) : null;
    if (item && def) total += getEffectLevel(item, def);
  }

  return total;
};
