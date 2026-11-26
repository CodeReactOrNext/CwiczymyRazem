import type {
  EffectInventoryItem,
  EffectType,
  GuitarRarity,
  InventoryItem,
  ItemTrait,
  TraitExtractor,
  TraitImprint,
} from "feature/arsenal/types/arsenal.types";

import { EFFECTS_BY_ID } from "./effectDefinitions";
import { GUITARS_BY_ID } from "./guitarDefinitions";
import { isTraitEligible, type TraitKind, TRAITS_BY_ID } from "./traits";

export type { TraitExtractor, TraitImprint };

/**
 * Moving traits between instruments.
 *
 * A trait used to be fixed the moment an instrument was minted. Now it can be
 * pulled out and put into another one, and both halves are deliberately hard:
 *
 *  • **Pulling one out takes a Trait Extractor**, a one-use tool that only drops
 *    from the Parts Crate (the Guitar Builder case), as a bonus on about one
 *    open in five. Using it lifts one trait off an instrument, value and all,
 *    into a Trait Imprint. The instrument stays; the trait is gone from it.
 *
 *  • **Putting one in costs a lot of Fame**, more for every trait the instrument
 *    already carries, and an instrument holds at most three. The trait has to
 *    be one the instrument could have rolled itself (`isTraitEligible`: guitar
 *    or pedal, pedal type, rarity window), and it cannot carry the same trait
 *    twice.
 *
 * Extractors and imprints are things, like rescued mods: they hang in the stash,
 * sell to the bin, and change hands on the market.
 */

/** Chance a Parts Crate open also drops a Trait Extractor. */
export const EXTRACTOR_DROP_CHANCE = 0.2;

/** Traits one instrument can carry, rolled and inserted together. */
export const MAX_ITEM_TRAITS = 3;

/**
 * Fame to put a trait in, by how many the instrument already carries: the
 * first is expensive, the third is a long-term project.
 */
export const TRAIT_INSERT_FAME = [3000, 7500, 15000] as const;

/** What the bin pays for an extractor. Far under what one costs to find. */
export const EXTRACTOR_RESALE_FAME = 60;

/** What the bin pays for an imprint: a floor plus a little per Fame/h. */
export const getImprintResaleValue = (
  imprint: Pick<TraitImprint, "value">,
): number => Math.round(40 + 5 * Math.max(0, imprint.value));

/** The imprint as the trait it becomes on an instrument. */
export const imprintAsTrait = (imprint: TraitImprint): ItemTrait => ({
  id: imprint.traitId,
  value: imprint.value,
  ...(imprint.params ? { params: imprint.params } : {}),
});

export const makeExtractor = (nowMs: number, salt: string): TraitExtractor => ({
  id: `extractor:${nowMs.toString(36)}-${salt}`,
  acquiredAt: nowMs,
});

export type ExtractRefusal = "NO_EXTRACTOR" | "NO_TRAIT";

export type ExtractDecision =
  | { ok: false; reason: ExtractRefusal }
  | {
      ok: true;
      imprint: TraitImprint;
      /** The instrument's traits after the one was lifted off. */
      traits: ItemTrait[];
      /** The extractors left after one was used. */
      extractors: TraitExtractor[];
    };

/**
 * Lifts `traitId` off an instrument with one of the player's extractors. The
 * imprint carries the exact value and params the instrument had, and nothing
 * about which instrument that was.
 */
export const decideExtract = ({
  salt,
  kind,
  traits,
  traitId,
  extractors,
  nowMs,
}: {
  /** Makes the imprint's id unique; carries nothing about the instrument. */
  salt: string;
  kind: TraitKind;
  traits: ItemTrait[] | undefined;
  traitId: string;
  extractors: TraitExtractor[] | undefined;
  nowMs: number;
}): ExtractDecision => {
  const tools = extractors ?? [];
  if (tools.length === 0) return { ok: false, reason: "NO_EXTRACTOR" };

  const current = traits ?? [];
  const index = current.findIndex((trait) => trait.id === traitId);
  if (index === -1) return { ok: false, reason: "NO_TRAIT" };

  const trait = current[index];
  return {
    ok: true,
    imprint: {
      id: `imprint:${nowMs.toString(36)}-${salt}`,
      traitId: trait.id,
      kind,
      value: trait.value,
      ...(trait.params ? { params: trait.params } : {}),
      extractedAt: nowMs,
    },
    traits: current.filter((_, i) => i !== index),
    // The oldest goes first, so the newest stays the one on the market card.
    extractors: tools.slice(1),
  };
};

export type InsertRefusal =
  | "UNKNOWN_TRAIT"
  | "WRONG_KIND"
  | "NOT_ELIGIBLE"
  | "DUPLICATE"
  | "FULL";

export type InsertDecision =
  | { ok: false; reason: InsertRefusal }
  | { ok: true; cost: number; traits: ItemTrait[] };

/** Fame the next trait costs on an instrument carrying `count`, or null when it is full. */
export const getInsertCost = (count: number): number | null =>
  count >= MAX_ITEM_TRAITS ? null : TRAIT_INSERT_FAME[Math.max(0, count)];

/**
 * Whether an imprint can go into an instrument, and what it costs. Fame is the
 * caller's check — this answers everything about the instrument itself.
 */
export const decideInsert = ({
  imprint,
  kind,
  rarity,
  effectType,
  traits,
}: {
  imprint: TraitImprint;
  kind: TraitKind;
  rarity: GuitarRarity;
  effectType?: EffectType;
  traits: ItemTrait[] | undefined;
}): InsertDecision => {
  const def = TRAITS_BY_ID.get(imprint.traitId);
  if (!def) return { ok: false, reason: "UNKNOWN_TRAIT" };
  if (imprint.kind !== kind || def.kind !== kind)
    return { ok: false, reason: "WRONG_KIND" };
  if (!isTraitEligible(def, kind, rarity, effectType)) {
    return { ok: false, reason: "NOT_ELIGIBLE" };
  }

  const current = traits ?? [];
  if (current.some((trait) => trait.id === imprint.traitId)) {
    return { ok: false, reason: "DUPLICATE" };
  }

  const cost = getInsertCost(current.length);
  if (cost === null) return { ok: false, reason: "FULL" };

  return { ok: true, cost, traits: [...current, imprintAsTrait(imprint)] };
};

/** What the trait rules need to know about an instrument, read off its definition. */
export interface TraitTarget {
  /** The rarity it was minted at — the one its own traits were rolled for. */
  rarity: GuitarRarity;
  effectType?: EffectType;
  /** "Brand Model", for the imprint's tile. */
  name: string;
}

export const getTraitTarget = (
  kind: TraitKind,
  item: InventoryItem | EffectInventoryItem,
): TraitTarget | null => {
  if (kind === "guitar") {
    const def = GUITARS_BY_ID.get((item as InventoryItem).guitarId);
    return def
      ? { rarity: def.rarity, name: `${def.brand} ${def.name}` }
      : null;
  }
  const def = EFFECTS_BY_ID.get((item as EffectInventoryItem).effectId);
  return def
    ? {
        rarity: def.rarity,
        effectType: def.type,
        name: `${def.brand} ${def.name}`,
      }
    : null;
};

/** What `/api/arsenal/traits/extract` answers. */
export interface ExtractTraitResult {
  imprint: TraitImprint;
  /** The instrument after the trait came off. */
  item: InventoryItem | EffectInventoryItem;
  extractorsLeft: number;
}

/** What `/api/arsenal/traits/insert` answers. */
export interface InsertTraitResult {
  /** The instrument with the trait in. */
  item: InventoryItem | EffectInventoryItem;
  fameSpent: number;
  newFame: number;
}

/** "Shred Machine" — the trait's card title, `{brand}` filled in, for logs and receipts. */
export const getTraitLabel = (
  traitId: string,
  params?: Record<string, string>,
): string => {
  const label = TRAITS_BY_ID.get(traitId)?.label ?? traitId;
  return params?.brand ? label.split("{brand}").join(params.brand) : label;
};

/** One instrument an imprint could go into, and what stands in the way. */
export interface InsertTarget {
  itemId: string;
  kind: TraitKind;
  name: string;
  rarity: GuitarRarity;
  traitCount: number;
  decision: InsertDecision;
}

/**
 * Every instrument of the imprint's kind, with the verdict on each: the ones it
 * can go into first (cheapest first), then the rest with the reason they
 * cannot take it.
 */
export const listInsertTargets = (
  imprint: TraitImprint,
  inventory: InventoryItem[],
  effectInventory: EffectInventoryItem[],
): InsertTarget[] => {
  const items: (InventoryItem | EffectInventoryItem)[] =
    imprint.kind === "guitar" ? inventory : effectInventory;

  return items
    .map((item): InsertTarget | null => {
      const target = getTraitTarget(imprint.kind, item);
      if (!target) return null;
      return {
        itemId: item.id,
        kind: imprint.kind,
        name: target.name,
        rarity: target.rarity,
        traitCount: item.traits?.length ?? 0,
        decision: decideInsert({
          imprint,
          kind: imprint.kind,
          rarity: target.rarity,
          effectType: target.effectType,
          traits: item.traits,
        }),
      };
    })
    .filter((entry): entry is InsertTarget => entry !== null)
    .sort((a, b) => {
      if (a.decision.ok !== b.decision.ok) return a.decision.ok ? -1 : 1;
      if (
        a.decision.ok &&
        b.decision.ok &&
        a.decision.cost !== b.decision.cost
      ) {
        return a.decision.cost - b.decision.cost;
      }
      return a.name.localeCompare(b.name);
    });
};
