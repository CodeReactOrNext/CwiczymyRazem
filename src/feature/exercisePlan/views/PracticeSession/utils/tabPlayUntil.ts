import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

import type { TempoRuler } from "../hooks/tempoBeatClock";

/**
 * Where a looping tab stops for good because the exercise's time runs out:
 * the end of the last bar that still fits. Counted from the tab's first beat
 * across every pass, so the second pass's bar 3 sits one whole tab further on.
 */
export interface TabPlayUntil {
  /** Score beats — the board's and the matcher's position. */
  beat: number;
  /** Warped beats (tempo automation applied) — × 60 / bpm gives seconds. */
  warped: number;
}

/** A bar has to be over this long before the time is up to be played at all. */
export const TAB_END_MARGIN_SEC = 1;

const EPS = 1e-6;

/**
 * The last bar end of a tab looped back to back that lies at or before
 * `endSec - marginSec` (seconds after the tab's first beat).
 *
 * A pass that ends by `endSec` itself is let through without the margin: a
 * song slot is sized to exactly one pass of its tab, and the margin would
 * otherwise cut that pass's closing bar.
 *
 * Null when there is nothing to cut against (no bars, no tempo).
 */
export function tabPlayUntil(
  measures: TablatureMeasure[] | null | undefined,
  ruler: TempoRuler,
  bpm: number,
  endSec: number,
  marginSec: number = TAB_END_MARGIN_SEC,
): TabPlayUntil | null {
  if (!measures?.length || !(bpm > 0) || !Number.isFinite(endSec)) return null;
  const totalWarped = ruler.totalWarped;
  if (!(totalWarped > 0)) return null;

  // Bar ends in score beats, and the same ends in warped beats.
  const barEnds: number[] = [];
  let cursor = 0;
  for (const m of measures) {
    cursor += m.beats.reduce((sum, b) => sum + b.duration, 0);
    barEnds.push(cursor);
  }
  const totalBeats = cursor;
  if (!(totalBeats > 0)) return null;
  const barEndsWarped = barEnds.map(b => ruler.toWarped(b));

  const beatsPerSec = bpm / 60;

  const lastBarEndBy = (limitWarped: number): TabPlayUntil => {
    if (limitWarped <= 0) return { beat: 0, warped: 0 };
    const pass = Math.floor(limitWarped / totalWarped + EPS);
    const inPass = limitWarped - pass * totalWarped;
    let beat = 0;
    let warped = 0;
    for (let i = 0; i < barEnds.length; i++) {
      if (barEndsWarped[i] > inPass + EPS) break;
      beat = barEnds[i];
      warped = barEndsWarped[i];
    }
    return { beat: pass * totalBeats + beat, warped: pass * totalWarped + warped };
  };

  const withMargin = lastBarEndBy((endSec - marginSec) * beatsPerSec);
  const endWarped = endSec * beatsPerSec;
  const passes = Math.floor(endWarped / totalWarped + EPS);
  if (passes * totalWarped > withMargin.warped + EPS) {
    return { beat: passes * totalBeats, warped: passes * totalWarped };
  }
  return withMargin;
}
