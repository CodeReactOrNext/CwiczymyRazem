import type {
  ItemFeature,
  SalvagedMod,
  WorkshopKind,
} from "../types/arsenal.types";
import type { WorkshopSubject } from "./workshop";
import { getFittableMods, getModDef, getModSlots } from "./workshop";

/**
 * Pulling a mod off an instrument that is being torn down.
 *
 * A teardown pays out parts, and parts are a currency — anything bought with
 * them can be bought again. A mod is not: a `+5 Hand-wound pickups` that came
 * out of a case is a thing that instrument *has*, and scrapping it used to burn
 * it. So one mod survives the teardown as an object, hangs in the stash, and can
 * later be bolted onto something else.
 *
 * Three rules keep that from turning into a feature farm, where a player opens
 * cheap cases, strips every mod off every drop and stacks them onto one guitar:
 *
 *  • **One mod per instrument, and the instrument picks it.** Which one survives
 *    is decided by hashing the item's own id, so it is fixed from the moment the
 *    item exists and is the same number on the client and on the server. The
 *    player reads it off the confirm dialog; they do not choose it. A twelve-mod
 *    Mythic gives up exactly as much as a one-mod Common: one mod.
 *
 *  • **It comes off worn.** A rescued mod loses `SALVAGE_POINT_LOSS`, floored at
 *    the bottom of its own range. Bench work still rolls the best numbers in the
 *    game, so salvage is a way to keep something, never a way to beat the
 *    workshop.
 *
 *  • **Fitting it back on is free.** The mod is already the player's — they paid
 *    an entire instrument for it, and did not even get to choose which one came
 *    off. A toll on top of that guards nothing: moving a mod already costs the
 *    guitar it was bolted to. If salvage ever needs reining in, the lever is the
 *    decay above, not a fee at the bench.
 *
 * Everything the mod bench already enforces still applies on top: it has to
 * physically fit the construction, the item needs a free slot, and it cannot
 * already carry that mod.
 */

/** Points a mod loses on the way out of a dying instrument. */
export const SALVAGE_POINT_LOSS = 1;

/**
 * FNV-1a. Any stable hash would do — what matters is that it is the same in the
 * browser and in the API route, so the mod named in the confirm dialog is the
 * mod the teardown actually hands over.
 */
const hash32 = (value: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/** The mod a teardown of this item would hand back, before it is stashed. */
export interface SalvageableMod {
  featureId: string;
  label: string;
  kind: WorkshopKind;
  /** What it will be worth once rescued. */
  points: number;
  /** What it is worth right now, on the instrument. */
  pointsBefore: number;
}

/**
 * Which of an item's mods survives its teardown, or `null` for an item with
 * nothing fitted.
 *
 * Scored per feature rather than by shuffling the list: the winner then depends
 * only on the item id and the feature's own id, so fitting a *new* mod cannot
 * quietly reshuffle which of the old ones was going to come off.
 */
export const getSalvageableMod = (
  item: { id: string; features?: ItemFeature[] },
  kind: WorkshopKind,
): SalvageableMod | null => {
  let best: { feature: ItemFeature; score: number } | null = null;

  for (const feature of item.features ?? []) {
    // A feature the pool no longer knows has no bill and no range, so there is
    // nothing to hand over — it stays in the scrap.
    if (!getModDef(kind, feature.id)) continue;

    const score = hash32(`${item.id}:${feature.id}`);
    if (
      !best ||
      score > best.score ||
      // Two ids hashing identically is vanishingly rare, but the pick still has
      // to be a function of the data alone rather than of the array order.
      (score === best.score && feature.id < best.feature.id)
    ) {
      best = { feature, score };
    }
  }

  if (!best) return null;

  const def = getModDef(kind, best.feature.id)!;
  return {
    featureId: def.id,
    label: def.label,
    kind,
    points: Math.max(def.min, best.feature.points - SALVAGE_POINT_LOSS),
    pointsBefore: best.feature.points,
  };
};

/**
 * The stash entry a teardown writes. Keyed on the item it came off — that item
 * is gone by the time this is stored, so the id can never be handed out twice.
 */
export const toSalvagedMod = (
  mod: SalvageableMod,
  sourceItemId: string,
  sourceName: string,
  now = Date.now(),
): SalvagedMod => ({
  id: `salvage:${sourceItemId}:${mod.featureId}`,
  featureId: mod.featureId,
  kind: mod.kind,
  points: mod.points,
  sourceName,
  salvagedAt: now,
});

/**
 * Whether this instrument could physically take this rescued mod — right pool,
 * fits the construction, not already fitted, and a slot free for it.
 *
 * This is the whole test, and it drives the stash board lighting up every
 * instrument a carried mod could go into.
 */
export const canFitSalvagedMod = (
  subject: WorkshopSubject,
  mod: SalvagedMod,
): boolean =>
  mod.kind === subject.kind &&
  getModSlots(subject).free > 0 &&
  !subject.features.some((f) => f.id === mod.featureId) &&
  getFittableMods(subject).some((def) => def.id === mod.featureId);

/** A stashed mod offered to one particular instrument. */
export interface SalvagedModOption {
  /** The stash entry this offer would consume. */
  salvagedId: string;
  featureId: string;
  label: string;
  points: number;
  sourceName: string;
}

/**
 * The stashed mods that could go onto this instrument — the bench's third list.
 *
 * Filtered exactly like the fit menu: right pool, physically fits the
 * construction, not already fitted. Slots are checked by the caller, the same
 * way `getModQuote` reports them, because "you own one but every slot is taken"
 * is worth showing rather than hiding.
 */
export const getSalvagedModOptions = (
  subject: WorkshopSubject,
  salvaged: SalvagedMod[] = [],
): SalvagedModOption[] => {
  const fittable = new Set(getFittableMods(subject).map((def) => def.id));
  const owned = new Set(subject.features.map((f) => f.id));

  return salvaged
    .filter(
      (mod) =>
        mod.kind === subject.kind &&
        fittable.has(mod.featureId) &&
        !owned.has(mod.featureId),
    )
    .map((mod) => ({
      salvagedId: mod.id,
      featureId: mod.featureId,
      label: getModDef(mod.kind, mod.featureId)?.label ?? mod.featureId,
      points: mod.points,
      sourceName: mod.sourceName,
    }));
};
