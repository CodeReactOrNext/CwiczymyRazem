import type {
  EffectInventoryItem,
  GuitarRarity,
  InventoryItem,
  MergeOffer,
} from "../types/arsenal.types";
import { EFFECTS_BY_ID } from "./effectDefinitions";
import { getEffectLevel } from "./effectStats";
import { GUITARS_BY_ID } from "./guitarDefinitions";
import { getItemLevel, RARITY_BUILD_GAIN } from "./itemStats";

/**
 * Duplicates level the copy you already own.
 *
 * A duplicate used to have exactly two destinations: the bin, for a sliver of
 * what the case cost, or the scrapyard, for parts. Neither one answered what a
 * player pulling their fortieth case actually wanted, which was for the thing in
 * their hand to be worth more because they kept opening. Merging folds the new
 * copy into the best copy of the same model and raises that copy's Item Level by
 * a fixed step, with no ceiling.
 *
 * ─── The step ───────────────────────────────────────────────────────────────
 *
 * It is `MERGE_GAIN_MULTIPLIER` times `RARITY_BUILD_GAIN` of the model's *mint*
 * rarity: Common and Uncommon +3, Rare and Epic +6, Legendary +9, Mythic +12.
 *
 * Built on the table the bench already runs on so the two keep one shape — a
 * rarer model is worth more in both places, in the same proportions — but with
 * a multiplier of its own. A merge started out at exactly one workshop build
 * level, which read as too little for a duplicate that cost a whole case; three
 * times that makes a merge a real step without touching what the Workshop
 * charges for the same levels.
 *
 * Mint rarity, never the promoted one, for the same reason scrap yield and sell
 * value are pinned to it: promoting an item must not make its duplicates worth
 * more.
 *
 * ─── What stops it printing anything ────────────────────────────────────────
 *
 * Only Item Level moves. Sell value reads rarity, condition and year at mint and
 * ignores level, so a merged copy sells for exactly what it did before; and the
 * rig pays roughly 0.15 Fame/h per level at a mid-game rig, so an Epic merge
 * (+6) is worth about one Fame per hour of practice against a case that cost
 * 350 to 500 — a payback measured in hundreds of hours, not days.
 *
 * ─── What can be folded away ────────────────────────────────────────────────
 *
 * The source is consumed, so it must not be carrying anything the player paid
 * for: no workshop build levels, no earlier merges, and never a Guitar Builder
 * guitar. It must not be in service either. Mods and traits on it are lost —
 * a merge is not a teardown, and scrapping is still the way to keep a mod.
 */

/**
 * How many times a workshop build level one merge is worth. The one number to
 * turn when merging should pay more or less; the Workshop does not read it.
 */
export const MERGE_GAIN_MULTIPLIER = 3;

/** Item Level points one merge adds. */
export const getMergeGain = (mintRarity: GuitarRarity): number =>
  (RARITY_BUILD_GAIN[mintRarity] ?? 1) * MERGE_GAIN_MULTIPLIER;

/** The fields every kind of item shares that merging cares about. */
interface Mergeable {
  id: string;
  custom?: unknown;
  buildLevel?: number;
  mergeBonus?: number;
  mergeCount?: number;
}

/** Can this copy be folded into another? It must carry nothing worth keeping. */
export const canMergeAway = (item: Mergeable): boolean =>
  !item.custom &&
  !((item.buildLevel ?? 0) > 0) &&
  !((item.mergeBonus ?? 0) > 0);

interface MergeKind<T extends Mergeable> {
  sameModel: (a: T, b: T) => boolean;
  levelOf: (item: T) => number;
  /** Points one merge of this item adds, or 0 when the model is unknown. */
  gainOf: (item: T) => number;
}

export const GUITAR_MERGE: MergeKind<InventoryItem> = {
  sameModel: (a, b) => a.guitarId === b.guitarId,
  levelOf: (item) => {
    const def = GUITARS_BY_ID.get(item.guitarId);
    return def ? getItemLevel(item, def) : 0;
  },
  gainOf: (item) => {
    const def = GUITARS_BY_ID.get(item.guitarId);
    return def ? getMergeGain(def.rarity) : 0;
  },
};

export const EFFECT_MERGE: MergeKind<EffectInventoryItem> = {
  sameModel: (a, b) => a.effectId === b.effectId,
  levelOf: (item) => {
    const def = EFFECTS_BY_ID.get(item.effectId);
    return def ? getEffectLevel(item, def) : 0;
  },
  gainOf: (item) => {
    const def = EFFECTS_BY_ID.get(item.effectId);
    return def ? getMergeGain(def.rarity) : 0;
  },
};

/**
 * The copy a duplicate would go into: the highest-level one of the same model
 * that is not itself about to be consumed. Ties go to whichever comes first in
 * the stash, which is the oldest.
 */
const pickTarget = <T extends Mergeable>(
  items: readonly T[],
  source: T,
  consumed: ReadonlySet<string>,
  kind: MergeKind<T>,
): T | null => {
  let best: T | null = null;
  let bestLevel = -Infinity;
  for (const item of items) {
    if (item.id === source.id || consumed.has(item.id) || item.custom) continue;
    if (!kind.sameModel(item, source)) continue;
    const level = kind.levelOf(item);
    if (level > bestLevel) {
      best = item;
      bestLevel = level;
    }
  }
  return best;
};

/**
 * What folding `sourceId` into the stash's best copy would do, or `null` when
 * there is nothing to fold it into (the only copy the player holds) or it may
 * not be folded away.
 */
export const getMergeOffer = <T extends Mergeable>(
  items: readonly T[],
  sourceId: string,
  kind: MergeKind<T>,
  blocked: ReadonlySet<string> = new Set(),
): MergeOffer | null => {
  const source = items.find((item) => item.id === sourceId);
  if (!source || blocked.has(sourceId) || !canMergeAway(source)) return null;

  const gain = kind.gainOf(source);
  if (gain <= 0) return null;

  const target = pickTarget(items, source, new Set([sourceId]), kind);
  if (!target) return null;

  const levelBefore = kind.levelOf(target);
  return {
    targetId: target.id,
    gain,
    levelBefore,
    levelAfter: levelBefore + gain,
  };
};

export interface MergePlan<T extends Mergeable> {
  /** The stash after the job: sources gone, targets raised. */
  items: T[];
  /** How many sources were folded in. */
  merged: number;
  /** Item Level points added across all of them. */
  gain: number;
  /** The targets that were raised, as they are now. */
  raised: T[];
  /** Sources that were left alone, and so are still in the stash. */
  skipped: string[];
}

/**
 * Folds every listed source into the best copy of its own model.
 *
 * All of `sourceIds` are excluded from being a target, so asking to merge two
 * copies of a model into each other cannot consume both — and a model the player
 * holds only as sources has nothing to land on, so those are skipped rather
 * than lost. Pure: the API route does the permission checks (what is in service)
 * and passes them in as `blocked`.
 */
export const planMerge = <T extends Mergeable>(
  items: readonly T[],
  sourceIds: readonly string[],
  kind: MergeKind<T>,
  blocked: ReadonlySet<string> = new Set(),
): MergePlan<T> => {
  const sources = new Set(sourceIds);
  let list = [...items];
  const skipped: string[] = [];
  const raisedIds = new Set<string>();
  let merged = 0;
  let gained = 0;

  for (const id of sources) {
    const source = list.find((item) => item.id === id);
    const gain = source ? kind.gainOf(source) : 0;
    if (!source || gain <= 0 || blocked.has(id) || !canMergeAway(source)) {
      skipped.push(id);
      continue;
    }

    const target = pickTarget(list, source, sources, kind);
    if (!target) {
      skipped.push(id);
      continue;
    }

    list = list
      .filter((item) => item.id !== id)
      .map((item) =>
        item.id === target.id
          ? {
              ...item,
              mergeBonus: (item.mergeBonus ?? 0) + gain,
              mergeCount: (item.mergeCount ?? 0) + 1,
            }
          : item,
      );
    raisedIds.add(target.id);
    merged += 1;
    gained += gain;
  }

  return {
    items: list,
    merged,
    gain: gained,
    raised: list.filter((item) => raisedIds.has(item.id)),
    skipped,
  };
};

/** Why a copy that has others of its model still cannot be merged right now. */
export type MergeBlock = "built" | "in-use" | "best";

export interface MergeState {
  /** What merging it would do. Null when `blocked` says why it cannot. */
  offer: MergeOffer | null;
  blocked?: MergeBlock;
}

/**
 * Whether, and how, one copy in the stash can be merged — for the screens that
 * show a merge key (the stash menu, an item's card).
 *
 * `null` when the model is held only once: with nothing to fold it into, the key
 * would only ever be switched off, so it should not be on screen at all. Where a
 * key is shown but cannot be pressed, `blocked` says which rule is in the way, in
 * the order the player can act on them:
 *
 *   built   workshop levels or an earlier merge — folding it away would throw
 *           that work out (`canMergeAway`)
 *   in-use  equipped, in the rig or on the board; take it out first
 *   best    it is the strongest copy, the one the others are folded *into*
 */
export const getMergeState = <T extends Mergeable>(
  items: readonly T[],
  itemId: string,
  kind: MergeKind<T>,
  inUse: ReadonlySet<string> = new Set(),
): MergeState | null => {
  const item = items.find((i) => i.id === itemId);
  if (!item) return null;

  const copies = items.filter((i) => kind.sameModel(i, item));
  if (copies.length < 2) return null;

  if (!canMergeAway(item)) return { offer: null, blocked: "built" };
  if (inUse.has(itemId)) return { offer: null, blocked: "in-use" };

  const offer = getMergeOffer(items, itemId, kind, inUse);
  if (!offer) return null;

  // Folding the strongest copy into a weaker one would be the wrong way round.
  if (kind.levelOf(item) > offer.levelBefore) {
    return { offer: null, blocked: "best" };
  }
  return { offer };
};
