import type { Instrument } from "utils/audio/tunings";
import { getStandardTuningId, getTuningPreset, isInstrument } from "utils/audio/tunings";
import { create } from "zustand";

const INSTRUMENT_KEY = "instrument_preference";
/** The guitar's key predates the bass, so it keeps its old name. */
const TUNING_KEYS: Record<Instrument, string> = {
  guitar: "guitar_tuning_preference",
  bass: "bass_tuning_preference",
};

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

function loadTuningId(instrument: Instrument): string {
  const raw = read(TUNING_KEYS[instrument]);
  return raw && getTuningPreset(raw).id === raw && getTuningPreset(raw).instrument === instrument
    ? raw
    : getStandardTuningId(instrument);
}

interface InstrumentPreferenceStore {
  /** What the player picked up — guitar unless they said otherwise. */
  instrument: Instrument;
  /** The tuning last chosen on each instrument, so switching back restores it. */
  tuningIds: Record<Instrument, string>;
  setInstrument: (instrument: Instrument) => void;
  /** Saves a preset as its own instrument's tuning (a bass preset never lands on the guitar). */
  setTuningId: (id: string) => void;
}

/**
 * The player's instrument and tuning, kept in localStorage. One store rather
 * than per-component state: the desktop title bar's tuner, the session and the
 * Tab Editor all read it, and a switch in one has to show in the others.
 */
export const useInstrumentPreferenceStore = create<InstrumentPreferenceStore>()((set) => {
  const stored = read(INSTRUMENT_KEY);
  return {
    instrument: isInstrument(stored) ? stored : "guitar",
    tuningIds: { guitar: loadTuningId("guitar"), bass: loadTuningId("bass") },
    setInstrument: (instrument) => {
      write(INSTRUMENT_KEY, instrument);
      set({ instrument });
    },
    setTuningId: (id) => {
      const preset = getTuningPreset(id);
      write(TUNING_KEYS[preset.instrument], preset.id);
      set((state) => ({ tuningIds: { ...state.tuningIds, [preset.instrument]: preset.id } }));
    },
  };
});
