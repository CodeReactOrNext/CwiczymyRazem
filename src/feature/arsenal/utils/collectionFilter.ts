import { RARITY_RANK } from "../components/RarityProgress";
import type { GuitarRarity } from "../types/arsenal.types";

/** Which half of the collection is on screen. */
export type CollectionScope = "all" | "guitars" | "pedals";

/**
 * How the visible items are ordered.
 *
 * `manual` is the stash board's own: the player arranged it, so nothing is
 * allowed to re-order it afterwards. `type` is the board's too — it is the one
 * order that keeps guitars, pedals, mods and parts apart, which only a board
 * that hangs all four in one grid can express.
 */
export type CollectionSort =
  | "rarity"
  | "level"
  | "newest"
  | "equipped"
  | "type"
  | "manual";

/**
 * Orders only the board can honour. The card grid borrows a real order while one
 * of these is chosen and gives it back on the way out — a glance at the cards
 * must not quietly re-sort the stash for good.
 */
const STASH_ONLY_SORTS: CollectionSort[] = ["manual", "type"];

export const isStashOnlySort = (sort: CollectionSort): boolean =>
  STASH_ONLY_SORTS.includes(sort);

/**
 * How the collection is drawn: dense stash sockets, or one full card per item.
 * The stash is the default — owning fifty guitars is a wall of cards nobody
 * scrolls, and the card is still one click (or one hover) away.
 */
export type CollectionView = "stash" | "cards";

/**
 * A guitar and a pedal have nothing in common in their raw shape, but the
 * collection treats them the same way: search by name, order by rarity/level/age.
 * Both grids map their items into this before filtering.
 */
export interface CollectionEntry<T> {
  item: T;
  /** "Brand Name" — what the search box matches against. */
  name: string;
  /** Effective rarity, i.e. after any workshop promotion. */
  rarity: GuitarRarity;
  level: number;
  acquiredAt: number;
  /** Same value for every copy of the same model, so copies stay together. */
  groupKey: string;
  /**
   * On the profile, in a rig slot or on the pedalboard — what `equipped` order
   * lifts to the front. Absent counts as not in use.
   */
  inUse?: boolean;
}

/** Case-insensitive, whitespace-tolerant "does this name contain the query". */
export const matchesQuery = (name: string, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return name.toLowerCase().includes(q);
};

export const filterEntries = <T>(
  entries: CollectionEntry<T>[],
  query: string,
): CollectionEntry<T>[] => entries.filter((e) => matchesQuery(e.name, query));

const byRarity = <T>(a: CollectionEntry<T>, b: CollectionEntry<T>) =>
  RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity];

/**
 * Sorting is total (never returns 0 for two different items) so the grid keeps a
 * stable order across re-renders — cards jumping around after an equip is worse
 * than a slightly arbitrary tie-break.
 */
export const sortEntries = <T>(
  entries: CollectionEntry<T>[],
  sort: CollectionSort,
): CollectionEntry<T>[] => {
  // Hand-arranged: the board places the pieces itself, so the list is left
  // exactly as it came in.
  if (sort === "manual") return [...entries];
  const sorted = [...entries];
  if (sort === "level") {
    sorted.sort(
      (a, b) =>
        b.level - a.level ||
        byRarity(a, b) ||
        b.acquiredAt - a.acquiredAt ||
        a.groupKey.localeCompare(b.groupKey, undefined, { numeric: true }),
    );
    return sorted;
  }
  if (sort === "newest") {
    sorted.sort(
      (a, b) =>
        b.acquiredAt - a.acquiredAt ||
        byRarity(a, b) ||
        b.level - a.level ||
        a.groupKey.localeCompare(b.groupKey, undefined, { numeric: true }),
    );
    return sorted;
  }
  // What the player actually plays, first. Everything they own is gear they
  // could equip, so the rest keeps the default order underneath it.
  if (sort === "equipped") {
    sorted.sort(
      (a, b) =>
        Number(b.inUse ?? false) - Number(a.inUse ?? false) ||
        byRarity(a, b) ||
        b.level - a.level ||
        a.groupKey.localeCompare(b.groupKey, undefined, { numeric: true }),
    );
    return sorted;
  }
  // Rarest first, copies of the same model kept side by side, best copy leading.
  // `type` lands here too: the split by kind is the board's to make, and inside
  // one kind "by type" can only mean the default order.
  sorted.sort(
    (a, b) =>
      byRarity(a, b) ||
      a.groupKey.localeCompare(b.groupKey, undefined, { numeric: true }) ||
      b.level - a.level ||
      b.acquiredAt - a.acquiredAt,
  );
  return sorted;
};

export const filterAndSortEntries = <T>(
  entries: CollectionEntry<T>[],
  query: string,
  sort: CollectionSort,
): T[] => sortEntries(filterEntries(entries, query), sort).map((e) => e.item);

/** Whether a section should render at all for the current scope. */
export const isScopeVisible = (
  scope: CollectionScope,
  section: "guitars" | "pedals",
): boolean => scope === "all" || scope === section;
