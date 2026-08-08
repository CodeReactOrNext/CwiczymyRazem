import { EFFECTS_BY_ID } from "../data/effectDefinitions";
import { getEffectLevel } from "../data/effectStats";
import { GUITARS_BY_ID } from "../data/guitarDefinitions";
import { getItemCondition, getItemLevel } from "../data/itemStats";
import type { WorkshopSubject } from "../data/workshop";
import { getEffectSubject, getGuitarSubject } from "../data/workshop";
import type {
  ArsenalUserData,
  GuitarRarity,
  WorkshopKind,
} from "../types/arsenal.types";
import { getRankBadgeSrc } from "./guitarImage";

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
  buildLog: string[];
  restored: boolean;
  subject: WorkshopSubject;
}

/**
 * Everything the player can put on the bench, best work first: what they have
 * already invested in, then what is worth investing in.
 */
export const getWorkshopEntries = (
  data:
    | Pick<ArsenalUserData, "inventory" | "effectInventory">
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
      rarity: def.rarity,
      imageSrc: getRankBadgeSrc(def.imageId, "small"),
      rotate: true,
      buildLevel: item.buildLevel ?? 0,
      condition: getItemCondition(item),
      level: getItemLevel(item, def),
      serial: item.serial,
      buildLog: item.buildLog ?? [],
      restored: item.restored ?? false,
      subject: getGuitarSubject(item, def),
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
      rarity: def.rarity,
      imageSrc: `/static/images/effects/${def.imageId}.png`,
      rotate: false,
      buildLevel: item.buildLevel ?? 0,
      condition: getItemCondition(item),
      level: getEffectLevel(item, def),
      serial: item.serial,
      buildLog: item.buildLog ?? [],
      restored: item.restored ?? false,
      subject: getEffectSubject(item, def),
    });
  }

  return entries.sort(
    (a, b) =>
      b.buildLevel - a.buildLevel ||
      b.level - a.level ||
      a.name.localeCompare(b.name),
  );
};
