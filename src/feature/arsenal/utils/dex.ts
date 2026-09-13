import type { ArsenalUserData, GuitarRarity } from "../types/arsenal.types";

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

/** The two kinds of gear the Dex records. Parts and mods are not collected. */
export type DexItemKind = "guitar" | "effect";

/** Where one definition stands with the player, as shown outside their own cabinet. */
export interface DexStatus {
  /** A copy is in the stash right now. */
  isOwned: boolean;
  /** Discovered — on the Dex record, or in the stash, which the Dex counts too. */
  inDex: boolean;
}

export type DexLookup = (
  kind: DexItemKind,
  definitionId: number | string,
) => DexStatus;

/**
 * Owned / Dex status per definition, off one read of the arsenal.
 *
 * The case preview, the market and the guild's shelf all ask the same question
 * of a definition — "do I have this, have I ever had this" — so they all ask it
 * here, and the marks they draw from the answer stay in step. Owned implies
 * discovered by construction (see `buildDiscoveredSet`); nothing owned and
 * nothing recorded is a plain `false`/`false`, which is what `undefined` data
 * resolves to as well.
 */
export const buildDexLookup = (
  data:
    | Pick<
        ArsenalUserData,
        "inventory" | "effectInventory" | "dexGuitars" | "dexEffects"
      >
    | undefined,
): DexLookup => {
  const ownedGuitars = new Set<number | string>();
  for (const item of data?.inventory ?? []) ownedGuitars.add(item.guitarId);
  const ownedEffects = new Set<number | string>();
  for (const item of data?.effectInventory ?? [])
    ownedEffects.add(item.effectId);

  const discoveredGuitars = buildDiscoveredSet(
    data?.dexGuitars,
    data?.inventory,
    (i) => i.guitarId,
  );
  const discoveredEffects = buildDiscoveredSet(
    data?.dexEffects,
    data?.effectInventory,
    (i) => i.effectId,
  );

  return (kind, definitionId) =>
    kind === "guitar"
      ? {
          isOwned: ownedGuitars.has(definitionId),
          inDex: discoveredGuitars.has(definitionId),
        }
      : {
          isOwned: ownedEffects.has(definitionId),
          inDex: discoveredEffects.has(definitionId),
        };
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
