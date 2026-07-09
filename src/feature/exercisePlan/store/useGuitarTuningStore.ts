import { DEFAULT_GUITAR_TUNING_ID } from "utils/audio/guitarTunings";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GuitarTuningState {
  /** User's preferred tuning for practice sessions. Applied to pitch detection and
   *  the backing guitar track for regular (non-GP-imported) exercises — see
   *  feature/exercisePlan/utils/practiceTuningLock for when it's ignored. */
  tuningId: string;
  setTuningId: (tuningId: string) => void;
}

export const useGuitarTuningStore = create<GuitarTuningState>()(
  persist(
    set => ({
      tuningId: DEFAULT_GUITAR_TUNING_ID,
      setTuningId: tuningId => set({ tuningId }),
    }),
    { name: "practice_guitar_tuning" }
  )
);
