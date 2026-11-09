import { create } from "zustand";

import type { TabPlayUntil } from "../utils/tabPlayUntil";

interface TabPlayUntilStore {
  /** Where the running tab stops for good (see tabPlayUntil.ts); null = it loops on. */
  until: TabPlayUntil | null;
  setUntil: (until: TabPlayUntil | null) => void;
}

/**
 * The end of the last bar the exercise's remaining time still fits, worked out
 * by the practice session each time playback starts. The board stops drawing
 * past it and the matcher stops expecting notes there — both read it from here
 * rather than through the half-dozen components in between.
 */
export const useTabPlayUntilStore = create<TabPlayUntilStore>((set) => ({
  until: null,
  setUntil: (until) => set((state) =>
    state.until?.beat === until?.beat && state.until?.warped === until?.warped ? state : { until },
  ),
}));
