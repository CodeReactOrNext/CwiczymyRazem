/** Accuracy (0–100) needed for each exam star; the first one is the pass mark. */
export const EXAM_STAR_ACCURACY = [93, 97, 99] as const;

/**
 * Share of the run's timed notes (0–100) that has to land on time for each
 * star. The pass asks for none: timing rides on the latency calibration, and a
 * player who never calibrated should not fail an exam over it — only miss the
 * higher stars.
 */
export const EXAM_STAR_ON_TIME = [null, 90, 95] as const;

export type ExamStars = 1 | 2 | 3;

/**
 * Stars an exam run earns, or null for a fail. Accuracy sets them (≥93% = 1,
 * ≥97% = 2, ≥99% = 3); the second and third also need the timing above.
 * `onTimePct` is null where timing isn't judged — a clicked exam, an exercise
 * scored on pitch, a run with too few timed notes — and then accuracy decides alone.
 */
export function accuracyToStars(accuracy: number, onTimePct: number | null = null): ExamStars | null {
  let stars = 0;
  while (stars < 3 && accuracy >= EXAM_STAR_ACCURACY[stars]) stars++;
  if (onTimePct !== null) {
    while (stars > 1 && onTimePct < (EXAM_STAR_ON_TIME[stars - 1] ?? 0)) stars--;
  }
  return stars === 0 ? null : (stars as ExamStars);
}
