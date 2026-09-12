import type { GuitarRarity } from "../types/arsenal.types";

/** One slot on the Dex wall, before any presentation is attached to it. */
export interface DexWallEntry {
  key: string;
  kind: "guitar" | "effect";
  id: number | string;
  /** 1-based position in its catalog — the Pokédex number, stable across filters. */
  number: number;
  name: string;
  brand: string;
  rarity: GuitarRarity;
  /** False = never held by this account (locked silhouette). */
  discovered: boolean;
  /** Copies in the stash right now. 0 on a discovered entry = sold, scrapped or listed. */
  ownedCount: number;
}

export type DexStatusFilter = "all" | "discovered" | "missing";
export type DexRarityFilter = "all" | GuitarRarity;

export interface DexWallFilters {
  rarity: DexRarityFilter;
  status: DexStatusFilter;
  query: string;
}

/** Six slots across, three rows: one wall of the display case per page. */
export const DEX_PAGE_SIZE = 18;

/** The rarity chips, best first — the order the wall is read in. */
export const DEX_RARITY_CHIPS: GuitarRarity[] = [
  "Mythic",
  "Legendary",
  "Epic",
  "Rare",
  "Uncommon",
  "Common",
];

/** "7" -> "07": slot numbers read as engraved plates, so they keep two digits. */
export const formatSlotNumber = (n: number) => String(n).padStart(2, "0");

const normalise = (s: string) => s.trim().toLowerCase();

/**
 * Applies the toolbar to a catalog. Search only ever matches what the player
 * can already see: a discovered entry by name or brand, an undiscovered one
 * by its slot number alone — typing a name must not light up a locked slot
 * and give the name away.
 */
export const filterDexEntries = <T extends DexWallEntry>(
  entries: readonly T[],
  { rarity, status, query }: DexWallFilters,
): T[] => {
  const q = normalise(query);
  return entries.filter((entry) => {
    if (rarity !== "all" && entry.rarity !== rarity) return false;
    if (status === "discovered" && !entry.discovered) return false;
    if (status === "missing" && entry.discovered) return false;
    if (!q) return true;
    if (entry.discovered) {
      return (
        normalise(entry.name).includes(q) || normalise(entry.brand).includes(q)
      );
    }
    return String(entry.number) === q || formatSlotNumber(entry.number) === q;
  });
};

export interface DexPage<T> {
  items: T[];
  /** 0-based, clamped into range so a stale page index after filtering is harmless. */
  page: number;
  pageCount: number;
}

export const paginateDexEntries = <T>(
  entries: readonly T[],
  requestedPage: number,
  pageSize = DEX_PAGE_SIZE,
): DexPage<T> => {
  const pageCount = Math.max(1, Math.ceil(entries.length / pageSize));
  const page = Math.min(Math.max(0, requestedPage), pageCount - 1);
  return {
    items: entries.slice(page * pageSize, page * pageSize + pageSize),
    page,
    pageCount,
  };
};
