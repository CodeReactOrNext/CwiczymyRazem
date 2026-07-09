import { useCallback, useMemo, useState } from "react";
import type { GuitarTuningPreset } from "utils/audio/tunings";
import { getTuningPreset, GUITAR_TUNINGS, STANDARD_TUNING_ID } from "utils/audio/tunings";

const STORAGE_KEY = "guitar_tuning_preference";

function loadTuningId(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && GUITAR_TUNINGS.some(t => t.id === raw) ? raw : STANDARD_TUNING_ID;
  } catch {
    return STANDARD_TUNING_ID;
  }
}

function saveTuningId(id: string): void {
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
}

export interface UseGuitarTuningOptions {
  /** The current exercise's notes carry their own real pitch straight from a parsed
   *  Guitar Pro file — its tuning is baked into the file, so the user's preference
   *  can't apply here. */
  isGpFile: boolean;
  /** Exams are scored against fixed reference material prepared only for standard tuning. */
  isExamMode: boolean;
}

export interface GuitarTuningState {
  /** The user's saved tuning preference, regardless of lock state. */
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

export function useGuitarTuning({ isGpFile, isExamMode }: UseGuitarTuningOptions): GuitarTuningState {
  const [tuningId, setTuningIdState] = useState<string>(loadTuningId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const setTuningId = useCallback((id: string) => {
    setTuningIdState(id);
    saveTuningId(id);
  }, []);

  const lockReason = isGpFile
    ? "Ten utwór pochodzi z importu Guitar Pro — strojenie jest zapisane w pliku i nie można go tu zmienić."
    : isExamMode
      ? "Strojenie jest zablokowane podczas egzaminu — zadania są przygotowane wyłącznie pod strojenie standardowe (E A D G B E)."
      : null;
  const isLocked = lockReason !== null;

  const preferredTuning = useMemo(() => getTuningPreset(tuningId), [tuningId]);
  const standardTuning = useMemo(() => getTuningPreset(STANDARD_TUNING_ID), []);
  const tuning = isLocked ? standardTuning : preferredTuning;

  return {
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
