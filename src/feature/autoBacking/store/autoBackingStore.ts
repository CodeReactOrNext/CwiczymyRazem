import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AutoBackingSummary } from "../generateAutoBacking";

interface AutoBackingState {
  /** The player's choice — remembered on this device, like track volumes.
   *  On until they turn it off. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  /** The one-time "wear headphones with the mic on" note has been shown. */
  headphonesHintShown: boolean;
  markHeadphonesHintShown: () => void;
  /** What the running session can offer: whether the exercise on screen can
   *  get a backing at all, and what it would play. Owned by PracticeSession,
   *  read by the volume menus in both the desktop and phone layouts. */
  available: boolean;
  summary: AutoBackingSummary | null;
  setSession: (session: {
    available: boolean;
    summary: AutoBackingSummary | null;
  }) => void;
}

export const useAutoBackingStore = create<AutoBackingState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
      headphonesHintShown: false,
      markHeadphonesHintShown: () => set({ headphonesHintShown: true }),
      available: false,
      summary: null,
      setSession: (session) => set(session),
    }),
    {
      name: "rq_auto_backing",
      // Version 0 stored the old off-by-default as if it were a choice.
      version: 1,
      migrate: (persisted, version) => {
        const stored = (persisted ?? {}) as Partial<AutoBackingState>;
        return {
          enabled: version < 1 ? true : (stored.enabled ?? true),
          headphonesHintShown: stored.headphonesHintShown ?? false,
        };
      },
      partialize: (state) => ({
        enabled: state.enabled,
        headphonesHintShown: state.headphonesHintShown,
      }),
    },
  ),
);
