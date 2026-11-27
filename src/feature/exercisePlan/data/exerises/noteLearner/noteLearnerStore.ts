import { create } from "zustand";
import { persist } from "zustand/middleware";

/** "all" = the whole neck, otherwise one string (1 = high e … 6 = low E). */
export type NoteLearnerStrings = "all" | 1 | 2 | 3 | 4 | 5 | 6;
export type NoteLearnerNotes = "naturals" | "all";

interface NoteLearnerState {
  strings: NoteLearnerStrings;
  notes: NoteLearnerNotes;
  /** Draws the asked note's spot on the neck: the look-it-up mode for a player
   *  who doesn't know the string yet. Off by default, the drill is recall. */
  showNotes: boolean;
  setStrings: (strings: NoteLearnerStrings) => void;
  setNotes: (notes: NoteLearnerNotes) => void;
  setShowNotes: (showNotes: boolean) => void;
}

const isStrings = (value: unknown): value is NoteLearnerStrings =>
  value === "all" || (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 6);

/**
 * What the learning hunt asks for — picked inside the session and remembered on
 * this device, so the next visit opens on the string the player was learning.
 * Read by the exercise's `rollHuntTarget` (outside React) through `getState()`.
 */
export const useNoteLearnerStore = create<NoteLearnerState>()(
  persist(
    (set) => ({
      strings: 6,
      notes: "naturals",
      showNotes: false,
      setStrings: (strings) => set({ strings }),
      setNotes: (notes) => set({ notes }),
      setShowNotes: (showNotes) => set({ showNotes }),
    }),
    {
      name: "rq_note_learner",
      version: 0,
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<NoteLearnerState>;
        return {
          ...current,
          strings: isStrings(stored.strings) ? stored.strings : current.strings,
          notes: stored.notes === "all" || stored.notes === "naturals" ? stored.notes : current.notes,
          showNotes: stored.showNotes === true,
        };
      },
      partialize: (state) => ({ strings: state.strings, notes: state.notes, showNotes: state.showNotes }),
    },
  ),
);
