import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Loudest the monitor goes: an iRig-style jack interface hands over a quiet,
 *  instrument-level signal, so 100% alone was often too soft to play to. */
export const GUITAR_MONITOR_MAX = 2;

interface GuitarMonitorState {
  /** The player hears their own guitar through the browser's output. Off until
   *  turned on — through speakers it feeds back into the mic. Per device. */
  enabled: boolean;
  /** 0 – GUITAR_MONITOR_MAX, 1 = the input as it comes in. */
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
}

export const useGuitarMonitorStore = create<GuitarMonitorState>()(
  persist(
    (set) => ({
      enabled: false,
      volume: 1,
      setEnabled: (enabled) => set({ enabled }),
      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(GUITAR_MONITOR_MAX, volume)) }),
    }),
    {
      name: "rq_guitar_monitor",
      partialize: (state) => ({ enabled: state.enabled, volume: state.volume }),
    },
  ),
);

/** The level the input is played back at — 0 while the monitor is off. */
export const selectGuitarMonitorLevel = (state: GuitarMonitorState) =>
  state.enabled ? state.volume : 0;
