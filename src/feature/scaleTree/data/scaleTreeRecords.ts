/**
 * Record runs: the same exam, but above the tempo the tree asks for. Clearing a
 * node is still a 95 BPM job — records are what you chase afterwards, and only
 * the fastest clean run is kept.
 */

/** Slowest tempo a record run may be attempted at — one rung above the exam. */
export const RECORD_MIN_BPM = 100;
/** Records move in whole steps, so "beat it by 1 BPM" isn't a thing. */
export const RECORD_BPM_STEP = 5;
/** Nothing musical happens past this; it's here to keep the stepper sane. */
export const RECORD_MAX_BPM = 300;
/** A record only counts if the run was clean — see `isRecordRunClean`. */
export const RECORD_PASS_ACCURACY = 90;

export function clampRecordBpm(bpm: number): number {
  return Math.min(RECORD_MAX_BPM, Math.max(RECORD_MIN_BPM, bpm));
}

/** Tempo the record stepper opens on: one step past the current record. */
export function nextRecordTarget(currentRecordBpm?: number | null): number {
  if (!currentRecordBpm) return RECORD_MIN_BPM;
  return clampRecordBpm(currentRecordBpm + RECORD_BPM_STEP);
}

/** Steps the stepper, staying on the RECORD_BPM_STEP grid. */
export function stepRecordBpm(bpm: number, direction: 1 | -1): number {
  return clampRecordBpm(bpm + direction * RECORD_BPM_STEP);
}

/** Whether a finished record run was played well enough to be written down. */
export function isRecordRunClean(accuracy: number): boolean {
  return accuracy >= RECORD_PASS_ACCURACY;
}
