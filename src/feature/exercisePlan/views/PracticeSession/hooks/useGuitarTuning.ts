import { useInstrumentPreferenceStore } from "feature/tuner/store/instrumentPreferenceStore";
import { useTranslation } from "hooks/useTranslation";
import { useCallback, useMemo, useState } from "react";
import type { GuitarTuningPreset, Instrument } from "utils/audio/tunings";
import {
  FILE_TUNING_ID,
  getFileTuning,
  getStandardTuningId,
  getTuningPreset,
  getTuningsFor,
  getTuningShiftFrom,
} from "utils/audio/tunings";

export interface UseGuitarTuningOptions {
  /** The current exercise's notes carry their own real pitch straight from a parsed
   *  Guitar Pro file — its tuning is baked into the file, so the player's saved
   *  preference doesn't apply; they can only say their whole instrument sits
   *  higher or lower than the file asks. */
  isGpFile: boolean;
  /** Exams are scored against fixed reference material prepared only for standard tuning. */
  isExamMode: boolean;
  /** The instrument the exercise itself is written for (a bass tab, a Guitar Pro
   *  bass track). Omitted when it isn't tied to one — the player's own pick applies. */
  contentInstrument?: Instrument;
  /** Strings the exercise's tab is written on, when it says (a Guitar Pro track does). */
  contentStringCount?: number;
  /** Open strings of the Guitar Pro track being played, string 1 first (MIDI notes). */
  fileOpenStringMidi?: readonly number[];
  /** What the player's choice for this file is remembered under — the exercise's id. */
  fileTuningKey?: string;
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
  /** Picks a tuning: the saved preference, or — on a Guitar Pro file — this file's own choice. */
  setTuningId: (id: string) => void;
  /** The preset actually driving pitch detection / playback right now — Standard while
   *  locked, the file's tuning (or the player's shifted pick) on a Guitar Pro file. */
  tuning: GuitarTuningPreset;
  /** The user's preferred preset — shown as "selected" in the picker even while locked. */
  preferredTuning: GuitarTuningPreset;
  /** The tuning the Guitar Pro file is written in, when it is known. */
  fileTuning: GuitarTuningPreset | null;
  /** Tunings the picker offers, the file's own first when no preset covers it. */
  tuningOptions: GuitarTuningPreset[];
  /** The option shown as picked. */
  selectedTuningId: string;
  /** False for a tuning that would move the notes off the tab's frets (Drop D on a
   *  file written in Standard) — only whole-instrument shifts keep the tab playable. */
  isTuningAvailable: (id: string) => boolean;
  /** Semitones the player's instrument sits from the file's tuning; the file's
   *  pitches (and its playback) move by this much. 0 off a Guitar Pro file. */
  pitchShift: number;
  isLocked: boolean;
  lockReason: string | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export function useGuitarTuning({
  isGpFile, isExamMode, contentInstrument, contentStringCount, fileOpenStringMidi, fileTuningKey,
}: UseGuitarTuningOptions): GuitarTuningState {
  const { t } = useTranslation("session");
  const preferredInstrument = useInstrumentPreferenceStore((s) => s.instrument);
  const setInstrument = useInstrumentPreferenceStore((s) => s.setInstrument);
  const tuningIds = useInstrumentPreferenceStore((s) => s.tuningIds);
  const setPreferredTuningId = useInstrumentPreferenceStore((s) => s.setTuningId);
  const fileTuningShifts = useInstrumentPreferenceStore((s) => s.fileTuningShifts);
  const setFileTuningShift = useInstrumentPreferenceStore((s) => s.setFileTuningShift);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const instrument = contentInstrument ?? preferredInstrument;
  const tuningId = tuningIds[instrument];

  const preferredTuning = useMemo(() => getTuningPreset(tuningId), [tuningId]);
  const standardTuning = useMemo(() => getTuningPreset(getStandardTuningId(instrument)), [instrument]);
  const presets = useMemo(() => getTuningsFor(instrument), [instrument]);

  // The file's own tuning — known once the file is parsed and the track is a
  // guitar or a bass. Exams stay on Standard whatever they are played from.
  const fileTuning = useMemo(() => {
    if (!isGpFile || isExamMode || !contentInstrument) return null;
    const tuning = getFileTuning(fileOpenStringMidi, contentInstrument);
    return tuning?.id === FILE_TUNING_ID ? { ...tuning, name: t("tuning_modal.file_tuning") } : tuning;
  }, [isGpFile, isExamMode, contentInstrument, fileOpenStringMidi, t]);

  // Per-file key: the same exercise re-uploaded in another tuning starts over.
  const shiftKey = fileTuning && fileTuningKey
    ? `${fileTuningKey}:${fileOpenStringMidi?.join(",") ?? ""}`
    : null;
  const savedShift = shiftKey ? fileTuningShifts[shiftKey] ?? 0 : 0;

  const fileChoice = useMemo(() => {
    if (!fileTuning) return null;
    const shifts = new Map<string, number>([[fileTuning.id, 0]]);
    presets.forEach((preset) => {
      const shift = getTuningShiftFrom(fileTuning, preset);
      if (shift !== null) shifts.set(preset.id, shift);
    });
    const options = presets.some((preset) => preset.id === fileTuning.id) ? presets : [fileTuning, ...presets];
    // A saved shift no preset stands for any more falls back to the file's tuning.
    const active = options.find((option) => shifts.get(option.id) === savedShift) ?? fileTuning;
    return { shifts, options, active };
  }, [fileTuning, presets, savedShift]);

  const hasFileAlternatives = !!fileChoice && fileChoice.shifts.size > 1;
  const lockReason = isExamMode
    ? t("tuning_lock.exam")
    : isGpFile && !hasFileAlternatives
      ? t("tuning_lock.gp")
      : null;
  const isLocked = lockReason !== null;
  const instrumentLockReason = contentInstrument
    ? t(contentInstrument === "bass" ? "tuning_modal.instrument_lock_bass" : "tuning_modal.instrument_lock_guitar")
    : null;

  const tuning = fileChoice
    ? fileChoice.active
    : isLocked ? standardTuning : preferredTuning;
  const pitchShift = fileChoice?.shifts.get(fileChoice.active.id) ?? 0;

  const setTuningId = useCallback((id: string) => {
    if (!fileChoice) { setPreferredTuningId(id); return; }
    const shift = fileChoice.shifts.get(id);
    if (shift !== undefined && shiftKey) setFileTuningShift(shiftKey, shift);
  }, [fileChoice, shiftKey, setPreferredTuningId, setFileTuningShift]);

  const isTuningAvailable = useCallback(
    (id: string) => !fileChoice || fileChoice.shifts.has(id),
    [fileChoice],
  );

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
    fileTuning,
    tuningOptions: fileChoice?.options ?? presets,
    selectedTuningId: fileChoice ? fileChoice.active.id : preferredTuning.id,
    isTuningAvailable,
    pitchShift,
    isLocked,
    lockReason,
    isModalOpen,
    openModal: useCallback(() => setIsModalOpen(true), []),
    closeModal: useCallback(() => setIsModalOpen(false), []),
  };
}
