import type { QueryClient } from "@tanstack/react-query";

import { EFFECTS_BY_ID } from "../../data/effectDefinitions";
import { getEffectLevel } from "../../data/effectStats";
import { GUITARS_BY_ID } from "../../data/guitarDefinitions";
import { getEffectiveRarity, getItemLevel } from "../../data/itemStats";
import { ARSENAL_QUERY_KEY } from "../../hooks/useArsenalData";
import type {
  ArsenalUserData,
  EffectDefinition,
  EffectInventoryItem,
  GuitarDefinition,
  GuitarRarity,
  InventoryItem,
  WorkshopKind,
} from "../../types/arsenal.types";
import { getEffectImageSrc } from "../../utils/effectImage";
import { getRankBadgeSrc } from "../../utils/guitarImage";
import { RARITY_STYLES } from "../RarityBadge";

/**
 * Everything a scene needs to draw one instrument: its artwork, the colour it is
 * lit in, and the level it walked in with. Resolved once, when the scene opens,
 * because by the time the server answers the item may already be gone from the
 * cache — a teardown's whole point is that it is.
 */
export interface SceneSubject {
  kind: WorkshopKind;
  name: string;
  art: string;
  rarity: GuitarRarity;
  /** The rarity's own colour — every spark and ring in the scene is cut in it. */
  color: string;
  level: number;
}

const guitarSubject = (
  def: GuitarDefinition,
  item?: InventoryItem,
): SceneSubject => {
  const rarity = getEffectiveRarity(def.rarity, item?.buildLevel);
  return {
    kind: "guitar",
    name: def.name,
    art: getRankBadgeSrc(def.imageId, "medium"),
    rarity,
    color: RARITY_STYLES[rarity].baseColor,
    level: item ? getItemLevel(item, def) : 0,
  };
};

const effectSubject = (
  def: EffectDefinition,
  item?: EffectInventoryItem,
): SceneSubject => {
  const rarity = getEffectiveRarity(def.rarity, item?.buildLevel);
  return {
    kind: "effect",
    name: def.name,
    art: getEffectImageSrc(def.imageId, "medium"),
    rarity,
    color: RARITY_STYLES[rarity].baseColor,
    level: item ? getEffectLevel(item, def) : 0,
  };
};

/** A model with no copy behind it yet — an order, or a counter's offer. */
export const subjectOfDef = (
  kind: WorkshopKind,
  def: GuitarDefinition | EffectDefinition,
): SceneSubject =>
  kind === "guitar"
    ? guitarSubject(def as GuitarDefinition)
    : effectSubject(def as EffectDefinition);

/** A copy the player holds, or `null` for a model the catalogue no longer has. */
export const subjectOfItem = (
  kind: WorkshopKind,
  item: InventoryItem | EffectInventoryItem,
): SceneSubject | null => {
  if (kind === "guitar") {
    const def = GUITARS_BY_ID.get((item as InventoryItem).guitarId);
    return def ? guitarSubject(def, item as InventoryItem) : null;
  }
  const def = EFFECTS_BY_ID.get((item as EffectInventoryItem).effectId);
  return def ? effectSubject(def, item as EffectInventoryItem) : null;
};

/**
 * A copy, looked up by id in the arsenal the screen is showing — for a scene
 * that needs more of it than the subject keeps, such as its condition.
 */
export const itemFromCache = (
  queryClient: QueryClient,
  kind: WorkshopKind,
  itemId: string,
): InventoryItem | EffectInventoryItem | null => {
  const data = queryClient.getQueryData<ArsenalUserData>(ARSENAL_QUERY_KEY);
  const list: (InventoryItem | EffectInventoryItem)[] =
    kind === "guitar" ? (data?.inventory ?? []) : (data?.effectInventory ?? []);
  return list.find((i) => i.id === itemId) ?? null;
};

/** The subject of a copy the screen is showing. */
export const subjectFromCache = (
  queryClient: QueryClient,
  kind: WorkshopKind,
  itemId: string,
): SceneSubject | null => {
  const item = itemFromCache(queryClient, kind, itemId);
  return item ? subjectOfItem(kind, item) : null;
};
