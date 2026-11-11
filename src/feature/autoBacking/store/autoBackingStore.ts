import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AutoBackingSummary } from "../generateAutoBacking";
import type { BandStylePreference } from "../styles";
import { isBandStyle } from "../styles";

interface AutoBackingState {
  /** The player's choice — remembered on this device, like track volumes.
   *  On until they turn it off. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  /** The band the player wants on every exercise, or "auto": each exercise
   *  picks its own. Remembered on this device. */
  style: BandStylePreference;
  setStyle: (style: BandStylePreference) => void;
  /** The player has read the start gate's "your mic can hear the backing" note. */
  leakNoticeDismissed: boolean;
  dismissLeakNotice: () => void;
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
      style: "auto",
      setStyle: (style) => set({ style }),
      leakNoticeDismissed: false,
      dismissLeakNotice: () => set({ leakNoticeDismissed: true }),
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
          leakNoticeDismissed: false,
          style: isBandStyle(stored.style) ? stored.style : "auto",
        };
      },
      partialize: (state) => ({
        enabled: state.enabled,
        leakNoticeDismissed: state.leakNoticeDismissed,
        style: state.style,
      }),
      // A style this build no longer has falls back to letting the exercise choose.
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<AutoBackingState>;
        return {
          ...current,
          ...stored,
          style: isBandStyle(stored.style) ? stored.style : "auto",
        };
      },
    },
  ),
);
