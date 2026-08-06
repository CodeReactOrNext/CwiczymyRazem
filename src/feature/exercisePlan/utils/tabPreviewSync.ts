/**
 * Maps positions in the tab editor's grid (pixels, cell indices) onto the live
 * preview's coordinate system (quarter notes from the start of the piece).
 */
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

import { beatsDurationInQuarters } from "./measureDuration";

/** A span of the piece, in quarter notes from its start. */
export interface BeatRange {
  startBeat: number;
  endBeat: number;
}

/**
 * One measure's horizontal box in the editor grid, measured from the left edge
 * of the scrollable *content* (not the viewport) — i.e. the same origin the
 * container's `scrollLeft` counts from.
 */
export interface MeasureBox {
  left: number;
  width: number;
}

/**
 * Maps the editor grid's horizontal scroll offset onto a position in the
 * tablature's own units (quarter notes from the start), so the preview can be
 * parked at whatever the user scrolled to.
 *
 * The grid draws every beat of a measure as an equally wide cell, while the
 * preview lays beats out by duration — hence the two-step walk: find the cell
 * under `scrollLeft` by pixels, then convert that cell index to quarters.
 */
export function beatAtScrollLeft(
  scrollLeft: number,
  measures: TablatureMeasure[],
  boxes: MeasureBox[],
): number {
  let quarters = 0;

  for (let mIdx = 0; mIdx < measures.length; mIdx++) {
    const beats = measures[mIdx].beats;
    const box = boxes[mIdx];

    // No box (not laid out yet) or an empty measure: nothing to interpolate
    // inside, so just skip past it.
    if (!box || box.width <= 0 || beats.length === 0) {
      quarters += beatsDurationInQuarters(beats);
      continue;
    }

    if (scrollLeft < box.left + box.width) {
      const cellWidth = box.width / beats.length;
      const local = Math.max(0, scrollLeft - box.left);
      const cellIdx = Math.min(beats.length - 1, Math.floor(local / cellWidth));
      for (let i = 0; i < cellIdx; i++) quarters += beats[i].duration;
      const fraction = (local - cellIdx * cellWidth) / cellWidth;
      return quarters + fraction * beats[cellIdx].duration;
    }

    quarters += beatsDurationInQuarters(beats);
  }

  // Scrolled past the last measure — park at the end of the piece.
  return quarters;
}

/**
 * Where a run of grid cells sits in the piece. `firstBeatIdx`/`lastBeatIdx` are
 * cell indices inside `measureIdx` (pass the same index twice for a single
 * cell); the returned range is what the preview needs to mark the same spot.
 *
 * Returns null when the cells don't exist — the grid can hold a stale selection
 * for a beat that an undo or a re-grid has since removed.
 */
export function beatRangeForCells(
  measures: TablatureMeasure[],
  measureIdx: number,
  firstBeatIdx: number,
  lastBeatIdx: number,
): BeatRange | null {
  const beats = measures[measureIdx]?.beats;
  if (!beats?.length) return null;

  const first = Math.max(0, Math.min(firstBeatIdx, lastBeatIdx));
  const last = Math.min(beats.length - 1, Math.max(firstBeatIdx, lastBeatIdx));
  if (first > last) return null;

  let startBeat = 0;
  for (let i = 0; i < measureIdx; i++) {
    startBeat += beatsDurationInQuarters(measures[i].beats);
  }
  for (let i = 0; i < first; i++) startBeat += beats[i].duration;

  let endBeat = startBeat;
  for (let i = first; i <= last; i++) endBeat += beats[i].duration;

  return { startBeat, endBeat };
}
