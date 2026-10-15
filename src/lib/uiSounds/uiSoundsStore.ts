import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiSoundsState {
  /** Short cues for rewards, level-ups and a finished session. On by default. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

/**
 * Per device, like the language: whether the app may make its own little sounds
 * depends on where you are (headphones at night vs. a speaker), not on the account.
 */
export const useUiSoundsStore = create<UiSoundsState>()(
  persist(
    (set) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: "riffquest-ui-sounds", version: 1 },
  ),
);
