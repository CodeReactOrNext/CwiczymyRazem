import { useState } from "react";
import { isLibrarySort, type LibrarySort } from "utils/librarySort";

const readStoredSort = (storageKey: string, fallback: LibrarySort): LibrarySort => {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(storageKey);
    return isLibrarySort(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
};

/** The sort a player picked for one of their library lists, remembered per browser. */
export const useLibrarySort = (storageKey: string, fallback: LibrarySort = "newest") => {
  const [sort, setSortState] = useState<LibrarySort>(() => readStoredSort(storageKey, fallback));

  const setSort = (next: LibrarySort) => {
    setSortState(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // Private mode or blocked storage — the choice just won't survive a reload.
    }
  };

  return [sort, setSort] as const;
};
