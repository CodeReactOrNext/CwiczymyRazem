import { useInstrumentPreferenceStore } from "feature/tuner/store/instrumentPreferenceStore";
import { useTranslation } from "hooks/useTranslation";
import { useCallback, useMemo, useState } from "react";
import type { GuitarTuningPreset, Instrument } from "utils/audio/tunings";
import { getStandardTuningId, getTuningPreset } from "utils/audio/tunings";

export interface UseGuitarTuningOptions {
  /** The current exercise's notes carry their own real pitch straight from a parsed
   *  Guitar Pro file — its tuning is baked into the file, so the user's preference
   *  can't apply here. */
  isGpFile: boolean;
  /** Exams are scored against fixed reference material prepared only for standard tuning. */
  isExamMode: boolean;
  /** The instrument the exercise itself is written for (a bass tab, a Guitar Pro
   *  bass track). Omitted when it isn't tied to one — the player's own pick applies. */
  contentInstrument?: Instrument;
  /** Strings the exercise's tab is written on, when it says (a Guitar Pro track does). */
  contentStringCount?: number;
}

export interface GuitarTuningState {
  /** The instrument being played right now — the exercise's, else the player's. */
  instrument: Instrument;
  /** The player's own pick, regardless of what the exercise asks for. */
  preferredInstrument: Instrument;
  setInstrument: (instrument: Instrument) => void;
  /** Set when the exercise is written for one instrument, so the player's pick doesn't apply. */
  instrumentLockReason: string | null;
  /** Lines the tab is drawn on — the exercise's own count, else the tuning's (4 on a bass). */
  stringCount: number;
  /** The user's saved tuning preference for the current instrument, regardless of lock state. */
  tuningId: string;
  setTuningId: (id: string) => void;
  /** The preset actually driving pitch detection / playback right now — forced to Standard while locked. */
  tuning: GuitarTuningPreset;
  /** The user's preferred preset — shown as "selected" in the picker even while locked. */
  preferredTuning: GuitarTuningPreset;
  isLocked: boolean;
  lockReason: string | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export function useGuitarTuning({ isGpFile, isExamMode, contentInstrument, contentStringCount }: UseGuitarTuningOptions): GuitarTuningState {
  const { t } = useTranslation("session");
  const preferredInstrument = useInstrumentPreferenceStore((s) => s.instrument);
  const setInstrument = useInstrumentPreferenceStore((s) => s.setInstrument);
  const tuningIds = useInstrumentPreferenceStore((s) => s.tuningIds);
  const setTuningId = useInstrumentPreferenceStore((s) => s.setTuningId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const instrument = contentInstrument ?? preferredInstrument;
  const tuningId = tuningIds[instrument];

  const lockReason = isGpFile
    ? t("tuning_lock.gp")
    : isExamMode
      ? t("tuning_lock.exam")
      : null;
  const isLocked = lockReason !== null;
  const instrumentLockReason = contentInstrument
    ? t(contentInstrument === "bass" ? "tuning_modal.instrument_lock_bass" : "tuning_modal.instrument_lock_guitar")
    : null;

  const preferredTuning = useMemo(() => getTuningPreset(tuningId), [tuningId]);
  const standardTuning = useMemo(() => getTuningPreset(getStandardTuningId(instrument)), [instrument]);
  const tuning = isLocked ? standardTuning : preferredTuning;

  return {
    instrument,
    preferredInstrument,
    setInstrument,
    instrumentLockReason,
    stringCount: contentStringCount ?? tuning.stringCount,
    tuningId,
    setTuningId,
    tuning,
    preferredTuning,
    isLocked,
    lockReason,
    isModalOpen,
    openModal: useCallback(() => setIsModalOpen(true), []),
    closeModal: useCallback(() => setIsModalOpen(false), []),
  };
}
