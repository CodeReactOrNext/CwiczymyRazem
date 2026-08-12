import { EFFECTS_BY_ID } from "../data/effectDefinitions";
import { getEffectLevel } from "../data/effectStats";
import { GUITARS_BY_ID } from "../data/guitarDefinitions";
import {
  getEffectiveRarity,
  getItemCondition,
  getItemLevel,
} from "../data/itemStats";
import type { WorkshopSubject } from "../data/workshop";
import { getEffectSubject, getGuitarSubject } from "../data/workshop";
import type {
  ArsenalUserData,
  BuildLogEntry,
  GuitarRarity,
  WorkshopKind,
} from "../types/arsenal.types";
import { readBuildLog } from "./buildLog";
import { getRankBadgeSrc } from "./guitarImage";
import type { ItemUse } from "./inUse";
import { getItemUses } from "./inUse";

/** One bench-ready item — guitars and pedals flattened into a single shape. */
export interface WorkshopEntry {
  id: string;
  kind: WorkshopKind;
  name: string;
  brand: string;
  rarity: GuitarRarity;
  imageSrc: string;
  /** Guitar art is drawn head-up, so a horizontal thumbnail has to rotate it. */
  rotate: boolean;
  buildLevel: number;
  condition: number;
  /** Current Item Level, build included. */
  level: number;
  serial?: number;
  /** The bench chronicle — jobs run on this item, oldest first. */
  buildLog: BuildLogEntry[];
  restored: boolean;
  subject: WorkshopSubject;
  /**
   * Where this item is in service right now, if anywhere. The workshop is the
   * one screen where that changes a decision: everything spent on gear sitting
   * in the stash does nothing for the Rig Level being ranked.
   */
  uses: ItemUse[];
}

/**
 * Everything the player can put on the bench: the gear they are actually
 * playing first, then their best work — what they have already invested in
 * ahead of what is only worth investing in.
 */
export const getWorkshopEntries = (
  data:
    | Pick<
        ArsenalUserData,
        "inventory" | "effectInventory" | "equippedItemId" | "rig"
      >
    | null
    | undefined,
): WorkshopEntry[] => {
  if (!data) return [];

  const entries: WorkshopEntry[] = [];

  for (const item of data.inventory ?? []) {
    const def = GUITARS_BY_ID.get(item.guitarId);
    if (!def) continue;
    entries.push({
      id: item.id,
      kind: "guitar",
      name: def.name,
      brand: def.brand,
      rarity: getEffectiveRarity(def.rarity, item.buildLevel),
      imageSrc: getRankBadgeSrc(def.imageId, "small"),
      rotate: true,
      buildLevel: item.buildLevel ?? 0,
      condition: getItemCondition(item),
      level: getItemLevel(item, def),
      serial: item.serial,
      buildLog: readBuildLog(item.buildLog),
      restored: item.restored ?? false,
      subject: getGuitarSubject(item, def),
      uses: getItemUses(data, item.id),
    });
  }

  for (const item of data.effectInventory ?? []) {
    const def = EFFECTS_BY_ID.get(item.effectId);
    if (!def) continue;
    entries.push({
      id: item.id,
      kind: "effect",
      name: def.name,
      brand: def.brand,
      rarity: getEffectiveRarity(def.rarity, item.buildLevel),
      imageSrc: `/static/images/effects/${def.imageId}.png`,
      rotate: false,
      buildLevel: item.buildLevel ?? 0,
      condition: getItemCondition(item),
      level: getEffectLevel(item, def),
      serial: item.serial,
      buildLog: readBuildLog(item.buildLog),
      restored: item.restored ?? false,
      subject: getEffectSubject(item, def),
      uses: getItemUses(data, item.id),
    });
  }

  // Gear in service leads the rack. Work on it is the only work that moves the
  // Rig Level, so the rack opens on the shortlist that is worth the parts.
  return entries.sort(
    (a, b) =>
      Number(b.uses.length > 0) - Number(a.uses.length > 0) ||
      b.buildLevel - a.buildLevel ||
      b.level - a.level ||
      a.name.localeCompare(b.name),
  );
};
