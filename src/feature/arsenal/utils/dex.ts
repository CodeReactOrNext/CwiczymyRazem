import type { GuitarRarity } from "../types/arsenal.types";

/** Anything definition-like the dex can count: id + rarity. */
interface DexDefinition {
  id: number | string;
  rarity: GuitarRarity;
}

export interface DexOwnership<TItem> {
  /** How many copies of this definition the user owns. */
  count: number;
  /** The highest-scoring copy (per the score function passed in). */
  best: TItem;
}

/** Groups inventory items by definition id, keeping a copy count and the best copy. */
export const buildOwnershipMap = <TItem>(
  items: readonly TItem[],
  getDefinitionId: (item: TItem) => number | string,
  getScore: (item: TItem) => number
): Map<number | string, DexOwnership<TItem>> => {
  const map = new Map<number | string, DexOwnership<TItem>>();
  for (const item of items) {
    const id = getDefinitionId(item);
    const entry = map.get(id);
    if (!entry) {
      map.set(id, { count: 1, best: item });
    } else {
      entry.count += 1;
      if (getScore(item) > getScore(entry.best)) entry.best = item;
    }
  }
  return map;
};

/**
 * What the Dex counts as discovered: every id on the account's record, plus
 * everything sitting in the stash right now.
 *
 * The stash half keeps the record self-healing — an account that predates the
 * record, or an item that arrived through a path that forgot to write to it,
 * still shows up as discovered while it is owned.
 */
export const buildDiscoveredSet = <TItem>(
  recorded: readonly (number | string)[] | undefined,
  items: readonly TItem[] | undefined,
  getDefinitionId: (item: TItem) => number | string
): Set<number | string> => {
  const discovered = new Set<number | string>(recorded ?? []);
  for (const item of items ?? []) discovered.add(getDefinitionId(item));
  return discovered;
};

export interface RarityCount {
  owned: number;
  total: number;
}

export interface DexProgress {
  owned: number;
  total: number;
  byRarity: Partial<Record<GuitarRarity, RarityCount>>;
}

/** Discovery progress across a definition list: overall and per rarity. */
export const getDexProgress = (
  definitions: readonly DexDefinition[],
  owned: { has: (id: number | string) => boolean }
): DexProgress => {
  const byRarity: Partial<Record<GuitarRarity, RarityCount>> = {};
  let ownedCount = 0;
  for (const def of definitions) {
    const bucket = (byRarity[def.rarity] ??= { owned: 0, total: 0 });
    bucket.total += 1;
    if (owned.has(def.id)) {
      bucket.owned += 1;
      ownedCount += 1;
    }
  }
  return { owned: ownedCount, total: definitions.length, byRarity };
};
