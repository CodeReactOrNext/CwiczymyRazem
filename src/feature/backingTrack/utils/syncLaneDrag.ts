import { snapSecToTransient } from "./alignment";
import { snapToOnset } from "./audioFeatures";
import type { RecordingTempoMap } from "./tempoMap";

/** How near the pointer has to be to a bar line to take hold of it, in CSS px. */
export const GRAB_SLOP_PX = 8;

/**
 * How far either side of the drop the snap looks for an attack — in pixels, so
 * it is "about a finger's width" at every zoom rather than a whole screen when
 * zoomed in.
 */
export const SNAP_SLOP_PX = 10;

/** A bar can never be dragged closer than this to a pinned neighbour. */
export const MIN_SPAN_SEC = 0.05;

/** The bar line (as a tab beat) within reach of a moment, or null between bars. */
export function barLineNear(params: {
  sec: number;
  secondsPerPixel: number;
  tempoMap: RecordingTempoMap;
  beatsPerBar: number;
  slopPx?: number;
}): number | null {
  const { sec, secondsPerPixel, tempoMap, slopPx = GRAB_SLOP_PX } = params;
  const perBar = Math.max(1, Math.round(params.beatsPerBar));
  // `|| 0` folds the -0 a pointer just left of bar 1 rounds to, which would
  // otherwise fail every `beat === 0` check downstream.
  const nearestBar = Math.round(tempoMap.beatForSec(sec) / perBar) * perBar || 0;
  if (nearestBar < 0) return null;
  const distancePx = Math.abs(tempoMap.secForBeat(nearestBar) - sec) / secondsPerPixel;
  return distancePx <= slopPx ? nearestBar : null;
}

export interface DragLimits {
  minSec: number;
  maxSec: number;
  /** The pinned point before the bar, for the tempo it is about to set. */
  prevBeat: number;
  prevSec: number;
}

/**
 * How far a bar line may travel before it would cross a pinned neighbour.
 *
 * A bar on or past the next pinned one is a span of no length — an infinite
 * tempo — so the line stops short of it instead. Bar 1 moves the whole tab
 * and has nothing before it to collide with.
 */
export function dragLimits(tempoMap: RecordingTempoMap, beat: number): DragLimits {
  const before = tempoMap.points.filter((point) => point.beat < beat).pop();
  const after = tempoMap.points.find((point) => point.beat > beat);
  const prevSec = before?.sec ?? tempoMap.secForBeat(0);
  return {
    minSec: beat === 0 ? Number.NEGATIVE_INFINITY : prevSec + MIN_SPAN_SEC,
    maxSec: after ? after.sec - MIN_SPAN_SEC : Number.POSITIVE_INFINITY,
    prevBeat: before?.beat ?? 0,
    prevSec,
  };
}

/**
 * Where a dragged bar line lands: exactly under the hand, pulled onto the
 * nearest attack unless `exact`, and never past its limits.
 *
 * The attack curve (`onset`) is the better guide once the recording has been
 * analysed — real attacks, a few milliseconds apart. Until then the drawn
 * outline stands in, which only knows where it got louder.
 */
export function placeDraggedLine(params: {
  originSec: number;
  dragPx: number;
  secondsPerPixel: number;
  limits: DragLimits;
  peaks: Float32Array | null;
  peaksPerSecond: number;
  onset?: Float32Array | null;
  onsetFps?: number;
  exact?: boolean;
}): { sec: number; snapped: boolean } {
  const { originSec, dragPx, secondsPerPixel, limits, peaks, peaksPerSecond, onset, onsetFps, exact } =
    params;
  const raw = originSec + dragPx * secondsPerPixel;
  const toleranceSec = SNAP_SLOP_PX * secondsPerPixel;
  const snapped = exact
    ? null
    : onset && onsetFps
      ? snapToOnset({ sec: raw, onset, onsetFps, toleranceSec })
      : snapSecToTransient({ sec: raw, peaks, peaksPerSecond, toleranceSec });
  const landed = snapped ?? raw;
  const sec = Math.min(limits.maxSec, Math.max(limits.minSec, landed));
  return { sec, snapped: snapped !== null && sec === snapped };
}
