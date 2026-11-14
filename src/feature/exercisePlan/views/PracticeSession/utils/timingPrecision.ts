/**
 * How tightly a run sat on the beat, read off the measured attack offsets of
 * its hit notes (signed ms, positive = late — see gradeTiming). Notes whose
 * attack couldn't be timed (releases, muted ticks) never get here. A hammer-on
 * or pull-off is timed by when its pitch came up (legatoHold.ts).
 */
export interface TimingPrecision {
  /** Typical distance of a note from its beat: the median of |offset|. Lower is tighter. */
  medianOffsetMs: number;
  /** Where the notes lean: the median signed offset. Negative = ahead of the beat. */
  biasMs: number;
  /** How many timed notes the figures come from. */
  measuredNotes: number;
}

/** Fewer timed notes than this and one stray attack would set the median. */
export const MIN_TIMED_NOTES = 8;

/** Cap on the offsets a run keeps — enough for the longest exercise many times over. */
export const MAX_TIMED_NOTES = 5000;

/** A run's hits whose attack could be timed, and how many of those were on time (grade 3). */
export interface TimedHits {
  onTime: number;
  measured: number;
}

export const emptyTimedHits = (): TimedHits => ({ onTime: 0, measured: 0 });

/**
 * Share of a run's timed notes that landed on time, 0–100 — what an exam's
 * stars ask of the timing. Unlike the grade counts it leaves out the notes
 * that got full marks only because nothing could be measured (releases,
 * muted ticks). null with too few timed notes to speak for the run.
 */
export const onTimePercent = (hits: TimedHits): number | null =>
  hits.measured < MIN_TIMED_NOTES ? null : Math.round((hits.onTime / hits.measured) * 100);

const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Median rather than mean: the detector's rare 30+ ms outliers, and the odd
 * note paired with the wrong attack, would otherwise move a whole run's figure.
 */
export const summarizeTimingOffsets = (
  offsetsMs: readonly number[],
): TimingPrecision | null => {
  if (offsetsMs.length < MIN_TIMED_NOTES) return null;
  return {
    medianOffsetMs: Math.round(median(offsetsMs.map(Math.abs))),
    biasMs: Math.round(median(offsetsMs)),
    measuredNotes: offsetsMs.length,
  };
};
