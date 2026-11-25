import type { RunNote } from "./timingGrade";

/** From here up a run reads as clean: green strip, confetti at the end. */
export const CLEAN_RUN_ACCURACY = 90;
/** A streak this long is worth saying out loud between two exercises. */
export const PROUD_STREAK = 16;

/** A bar is only called out once it has had this many graded notes… */
const MIN_BAR_NOTES = 4;
/** …and fewer of them were hit than this. */
const WEAK_BAR_HIT_RATE = 0.8;

/**
 * The bar the run went worst in, as an index into the tab's measures — every
 * pass of a looping tab counts towards it. null when no bar stands out, or the
 * tab is a single bar and there is nothing to single out.
 */
export const weakestMeasure = (noteLog: readonly RunNote[] | null | undefined): number | null => {
  const bars = new Map<number, { hits: number; total: number }>();
  for (const { measure, hit } of noteLog ?? []) {
    if (measure === undefined) continue;
    const bar = bars.get(measure) ?? { hits: 0, total: 0 };
    bar.total += 1;
    if (hit) bar.hits += 1;
    bars.set(measure, bar);
  }
  if (bars.size < 2) return null;

  let worst: { measure: number; rate: number } | null = null;
  for (const [measure, { hits, total }] of bars) {
    const rate = hits / total;
    if (total < MIN_BAR_NOTES || rate >= WEAK_BAR_HIT_RATE) continue;
    if (!worst || rate < worst.rate) worst = { measure, rate };
  }
  return worst?.measure ?? null;
};

/** How a run that just ran its clock down is answered on the session's bar. */
export type RunVerdict =
  /** Nothing listened (or nothing was heard): only the time is confirmed. */
  | { kind: "time" }
  | { kind: "clean"; accuracy: number; streak: number }
  | { kind: "rough"; accuracy: number; streak: number; weakMeasure: number | null };

interface RunSummary {
  accuracy: number;
  maxCombo: number;
  noteLog?: readonly RunNote[] | null;
}

/** `run` is null where the session had nothing to judge the playing by. */
export const getRunVerdict = (run: RunSummary | null): RunVerdict => {
  // A run without a single hit is a mic that heard nothing far more often than
  // a player who missed everything — it is no grade to hand out.
  if (!run || run.maxCombo === 0) return { kind: "time" };
  const accuracy = Math.round(run.accuracy);
  if (accuracy >= CLEAN_RUN_ACCURACY) return { kind: "clean", accuracy, streak: run.maxCombo };
  return { kind: "rough", accuracy, streak: run.maxCombo, weakMeasure: weakestMeasure(run.noteLog) };
};

/** The plan is played half through once the exercise at `index` is done. Short
 *  plans have no half worth stopping for. */
export const isPlanHalfway = (index: number, total: number): boolean =>
  total >= 4 && index + 1 === Math.ceil(total / 2);
