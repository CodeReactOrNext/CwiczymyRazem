import { create } from "zustand";
import { persist } from "zustand/middleware";

/** "all" = the whole neck, otherwise one string (1 = high e … 6 = low E). */
export type NoteLearnerStrings = "all" | 1 | 2 | 3 | 4 | 5 | 6;
export type NoteLearnerNotes = "naturals" | "all";

interface NoteLearnerState {
  strings: NoteLearnerStrings;
  notes: NoteLearnerNotes;
  setStrings: (strings: NoteLearnerStrings) => void;
  setNotes: (notes: NoteLearnerNotes) => void;
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
      setStrings: (strings) => set({ strings }),
      setNotes: (notes) => set({ notes }),
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
        };
      },
      partialize: (state) => ({ strings: state.strings, notes: state.notes }),
    },
  ),
);
