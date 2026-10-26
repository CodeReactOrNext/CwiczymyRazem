import type { RefObject } from "react";
import type { GuitarTuningPreset } from "utils/audio/tunings";
import { create } from "zustand";

export interface SessionTunerSource {
  frequencyRef: RefObject<number>;
  volumeRef: RefObject<number>;
  isListening: boolean;
  /** The tuning the session grades against — the tuner targets the same strings. */
  tuning: GuitarTuningPreset;
  isTuningLocked: boolean;
}

interface SessionTunerStore {
  source: SessionTunerSource | null;
  setSource: (source: SessionTunerSource | null) => void;
}

/**
 * The practice session's pitch input, while it has one open. The desktop
 * title bar's tuner reads from it instead of opening its own capture: the
 * native engine has one capture slot, and a second consumer's stop() would
 * tear the session's stream down.
 */
export const useSessionTunerStore = create<SessionTunerStore>()((set) => ({
  source: null,
  setSource: (source) => set({ source }),
}));
