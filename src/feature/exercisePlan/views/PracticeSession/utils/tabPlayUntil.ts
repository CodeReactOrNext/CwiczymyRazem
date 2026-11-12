import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

import type { TempoRuler } from "../hooks/tempoBeatClock";

/**
 * Where a looping tab stops for good because the exercise's time runs out:
 * the end of the last bar that still fits — or, where that would leave too
 * long a silence, a point inside the next bar. Counted from the tab's first
 * beat across every pass, so the second pass's bar 3 sits one whole tab
 * further on.
 */
export interface TabPlayUntil {
  /** Score beats — the board's and the matcher's position. */
  beat: number;
  /** Warped beats (tempo automation applied) — × 60 / bpm gives seconds. */
  warped: number;
}

/** A bar has to be over this long before the time is up to be played at all. */
export const TAB_END_MARGIN_SEC = 1;

/**
 * The longest the tab may sit silent while the clock runs out. A slow bar is
 * longer than this, so stopping on bar lines alone left players waiting.
 */
export const TAB_END_MAX_SILENCE_SEC = 3;

const EPS = 1e-6;

/**
 * The last bar end of a tab looped back to back that lies at or before
 * `endSec - marginSec` (seconds after the tab's first beat).
 *
 * When that bar end leaves more than `maxSilenceSec` of silence, the cut moves
 * into the next bar: to the last whole beat that fits, and if even that is too
 * early (a long note across beats), to the last note that fits.
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
  maxSilenceSec: number = TAB_END_MAX_SILENCE_SEC,
): TabPlayUntil | null {
  if (!measures?.length || !(bpm > 0) || !Number.isFinite(endSec)) return null;
  const totalWarped = ruler.totalWarped;
  if (!(totalWarped > 0)) return null;

  // Places the tab may stop, in score beats from the top of a pass — coarsest
  // first: bar ends, then whole beats inside the bars, then every note's end.
  const barEnds: number[] = [];
  const beatEnds: number[] = [];
  const noteEnds: number[] = [];
  let cursor = 0;
  for (const m of measures) {
    const barStart = cursor;
    for (const b of m.beats) {
      cursor += b.duration;
      noteEnds.push(cursor);
    }
    for (let at = barStart + 1; at < cursor - EPS; at++) beatEnds.push(at);
    beatEnds.push(cursor);
    barEnds.push(cursor);
  }
  const totalBeats = cursor;
  if (!(totalBeats > 0)) return null;

  const beatsPerSec = bpm / 60;
  const limitWarped = (endSec - marginSec) * beatsPerSec;

  const lastEndBy = (ends: number[]): TabPlayUntil => {
    if (limitWarped <= 0) return { beat: 0, warped: 0 };
    const pass = Math.floor(limitWarped / totalWarped + EPS);
    const inPass = limitWarped - pass * totalWarped;
    let beat = 0;
    let warped = 0;
    for (const end of ends) {
      const endWarped = ruler.toWarped(end);
      if (endWarped > inPass + EPS) break;
      beat = end;
      warped = endWarped;
    }
    return { beat: pass * totalBeats + beat, warped: pass * totalWarped + warped };
  };

  // The coarsest stop that keeps the silence short enough; the finest one
  // when none does (a single note longer than the silence allowed).
  let withMargin = lastEndBy(barEnds);
  for (const ends of [beatEnds, noteEnds]) {
    if (endSec - withMargin.warped / beatsPerSec <= maxSilenceSec + EPS) break;
    withMargin = lastEndBy(ends);
  }

  const endWarped = endSec * beatsPerSec;
  const passes = Math.floor(endWarped / totalWarped + EPS);
  if (passes * totalWarped > withMargin.warped + EPS) {
    return { beat: passes * totalBeats, warped: passes * totalWarped };
  }
  return withMargin;
}
