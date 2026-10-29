import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BossSoundState {
  /** The fight's sound effects — countdowns, strikes, gates. On until turned off, per device. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useBossSoundStore = create<BossSoundState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: "rq_boss_sounds", partialize: (state) => ({ enabled: state.enabled }) },
  ),
);
