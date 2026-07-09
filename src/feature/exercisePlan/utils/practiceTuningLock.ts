interface TuningLockContext {
  /** Exercise plays back a parsed Guitar Pro file — its notes already carry the
   *  file's real tuning via TablatureNote.midiNote, so a user tuning override
   *  would fight the imported pitch instead of matching it. */
  isGpExercise: boolean;
  /** Exams are graded against a fixed Standard E reference and can't be retuned. */
  isExamMode: boolean;
}

export function isPracticeTuningLocked({ isGpExercise, isExamMode }: TuningLockContext): boolean {
  return isGpExercise || isExamMode;
}

/** Human-readable reason shown in the tuning settings modal when locked. Null when unlocked. */
export function getPracticeTuningLockReason({ isGpExercise, isExamMode }: TuningLockContext): string | null {
  if (isExamMode) return "Exams are always graded in Standard E tuning — this can't be changed here.";
  if (isGpExercise) return "This exercise comes from an imported Guitar Pro file, which already carries its own tuning — pitch detection and playback follow whatever is written in the file.";
  return null;
}
