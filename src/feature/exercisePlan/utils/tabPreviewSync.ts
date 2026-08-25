/**
 * Maps positions in the tab editor's grid (pixels, cell indices) onto the live
 * preview's coordinate system (quarter notes from the start of the piece).
 */
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";

import { beatsDurationInQuarters } from "./measureDuration";
import { beatCellWidth } from "./tabGridLayout";

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
 * The grid sizes each cell by its own duration, so the walk is: find the cell
 * under `scrollLeft` by pixels, then convert that cell index to quarters. Cell
 * widths come from the same helper the grid renders with (rather than the box
 * divided by the cell count), so a bar mixing half notes with sixteenths maps
 * just as exactly as a uniform one.
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
      // Scaled to the box actually measured in the DOM, so borders and any
      // rounding between the two don't accumulate across the strip.
      const widths = beats.map((beat) => beatCellWidth(beat.duration));
      const scale =
        box.width / widths.reduce((total, width) => total + width, 0);
      const local = Math.max(0, scrollLeft - box.left);

      let cellLeft = 0;
      for (let i = 0; i < beats.length; i++) {
        const cellWidth = widths[i] * scale;
        if (local < cellLeft + cellWidth || i === beats.length - 1) {
          const fraction = Math.min(1, (local - cellLeft) / cellWidth);
          return quarters + fraction * beats[i].duration;
        }
        cellLeft += cellWidth;
        quarters += beats[i].duration;
      }
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
  return beatRangeForSpan(
    measures,
    measureIdx,
    Math.min(firstBeatIdx, lastBeatIdx),
    measureIdx,
    Math.max(firstBeatIdx, lastBeatIdx),
  );
}

/**
 * Same as `beatRangeForCells`, for a run that crosses bar lines — the editor's
 * selection can start in one measure and end in another.
 */
export function beatRangeForSpan(
  measures: TablatureMeasure[],
  firstMeasureIdx: number,
  firstBeatIdx: number,
  lastMeasureIdx: number,
  lastBeatIdx: number,
): BeatRange | null {
  const firstMeasure = measures[firstMeasureIdx];
  const lastMeasure = measures[Math.min(lastMeasureIdx, measures.length - 1)];
  if (!firstMeasure?.beats.length || !lastMeasure?.beats.length) return null;

  const first = Math.max(0, Math.min(firstBeatIdx, firstMeasure.beats.length - 1));
  const last = Math.max(0, Math.min(lastBeatIdx, lastMeasure.beats.length - 1));

  let startBeat = 0;
  for (let i = 0; i < firstMeasureIdx; i++) {
    startBeat += beatsDurationInQuarters(measures[i].beats);
  }
  for (let i = 0; i < first; i++) startBeat += firstMeasure.beats[i].duration;

  let endBeat = startBeat;
  for (
    let measureIdx = firstMeasureIdx;
    measureIdx <= Math.min(lastMeasureIdx, measures.length - 1);
    measureIdx++
  ) {
    const beats = measures[measureIdx].beats;
    const from = measureIdx === firstMeasureIdx ? first : 0;
    const to = measureIdx === lastMeasureIdx ? last : beats.length - 1;
    for (let i = from; i <= to; i++) endBeat += beats[i].duration;
  }

  return { startBeat, endBeat };
}
