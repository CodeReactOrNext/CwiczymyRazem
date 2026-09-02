import type { ArsenalUserData } from "../types/arsenal.types";
import { EFFECTS_BY_ID } from "./effectDefinitions";
import { getEffectLevel } from "./effectStats";
import { GUITARS_BY_ID } from "./guitarDefinitions";
import { getItemLevel } from "./itemStats";
import { isPoweredIn } from "./powerSupply";

/**
 * Total rig level = levels of equipped guitars (slots) + pedalboard effects.
 *
 * Only pedals with a cable to the power brick count. A dead pedal is a box the
 * signal walks straight through — it is already out of the chain in
 * `data/signalChain`, so counting its level here would have let a player buy the
 * whole Fame rate the brick is supposed to gate simply by standing pedals on the
 * board. A board saved before the brick existed has no links at all and is read
 * as fully powered, so nobody loses a level to the migration.
 */
export const getRigLevel = (
  arsenal:
    | Pick<ArsenalUserData, "rig" | "inventory" | "effectInventory">
    | null
    | undefined,
): number => {
  if (!arsenal) return 0;
  let total = 0;

  for (const slotId of arsenal.rig?.guitarSlots ?? []) {
    if (!slotId) continue;
    const item = arsenal.inventory?.find((i) => i.id === slotId);
    const def = item ? GUITARS_BY_ID.get(item.guitarId) : null;
    if (item && def) total += getItemLevel(item, def);
  }

  const powered = isPoweredIn(arsenal.rig);

  for (const placement of arsenal.rig?.pedalboardItems ?? []) {
    if (!powered(placement.itemId)) continue;
    const item = arsenal.effectInventory?.find(
      (e) => e.id === placement.itemId,
    );
    const def = item ? EFFECTS_BY_ID.get(item.effectId) : null;
    if (item && def) total += getEffectLevel(item, def);
  }

  return total;
};
