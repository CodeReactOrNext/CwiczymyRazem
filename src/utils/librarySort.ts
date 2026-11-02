export type LibrarySort = "newest" | "oldest" | "name";

export const LIBRARY_SORTS: LibrarySort[] = ["newest", "oldest", "name"];

export const isLibrarySort = (value: unknown): value is LibrarySort =>
  LIBRARY_SORTS.includes(value as LibrarySort);

interface Sortable {
  title: string;
  /** Items without a date sort as the oldest. */
  createdAtMs: number | null;
}

const compareTitles = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });

/**
 * Orders a player's own plans/exercises. Ties (same date, same name) fall back
 * to the other key so the order never shuffles between loads.
 */
export const sortLibraryItems = <T>(
  items: T[],
  sort: LibrarySort,
  toSortable: (item: T) => Sortable,
): T[] => {
  const keyed = items.map((item) => ({ item, key: toSortable(item) }));

  keyed.sort((a, b) => {
    const titleOrder = compareTitles(a.key.title.trim(), b.key.title.trim());
    if (sort === "name") return titleOrder;

    const aTime = a.key.createdAtMs ?? 0;
    const bTime = b.key.createdAtMs ?? 0;
    const dateOrder = sort === "newest" ? bTime - aTime : aTime - bTime;
    return dateOrder || titleOrder;
  });

  return keyed.map(({ item }) => item);
};
