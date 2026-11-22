import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { TourContext, TourDestination } from "./tourSteps";

export type TourSource = "onboarding" | "menu";

interface TourState extends TourContext {
  active: boolean;
  /** Index into `getTourSteps(...)` for the current screen. */
  index: number;
  /** Which way the player last moved: a missing optional step is skipped this way. */
  direction: 1 | -1;
  source: TourSource;
  startedAt: number;
  start: (context: TourContext, source: TourSource) => void;
  goTo: (index: number) => void;
  stop: () => void;
}

/**
 * The tour runs across two pages (Home, then Practice), so its place lives
 * here and not in a component. Kept for the tab only: a reload mid-tour picks
 * up on the same step, a new visit next week does not.
 */
export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      active: false,
      index: 0,
      direction: 1,
      destination: null as TourDestination | null,
      noGuitar: false,
      source: "onboarding",
      startedAt: 0,
      start: (context, source) =>
        set({
          ...context,
          source,
          active: true,
          index: 0,
          direction: 1,
          startedAt: Date.now(),
        }),
      goTo: (index) =>
        set((state) => ({
          index: Math.max(0, index),
          direction: index < state.index ? -1 : 1,
        })),
      stop: () => set({ active: false, index: 0 }),
    }),
    {
      name: "riff-quest-tour",
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({
        active,
        index,
        direction,
        destination,
        noGuitar,
        source,
        startedAt,
      }) => ({
        active,
        index,
        direction,
        destination,
        noGuitar,
        source,
        startedAt,
      }),
    },
  ),
);
