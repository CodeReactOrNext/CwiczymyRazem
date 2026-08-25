import type { TablatureBeat } from "feature/exercisePlan/types/exercise.types";

/**
 * Width of one quarter note in the tab editor's grid. Picked so the default
 * sixteenth-note grid keeps its familiar 32px cells (0.25 × 128).
 */
export const QUARTER_CELL_PX = 128;

/** A thirty-second still has to be clickable, a whole note still has to fit. */
const MIN_CELL_PX = 24;
const MAX_CELL_PX = 512;

/**
 * How wide a beat's column is drawn. Length is the only thing the editor can
 * show about rhythm, so a half note is literally twice the sixteenth next to
 * it — the same proportional layout the live preview uses.
 */
export function beatCellWidth(duration: number): number {
  return Math.round(
    Math.max(MIN_CELL_PX, Math.min(MAX_CELL_PX, duration * QUARTER_CELL_PX)),
  );
}

/** Left edge of each beat's column inside its measure, in pixels. */
export function beatCellOffsets(beats: TablatureBeat[]): number[] {
  let offset = 0;
  return beats.map((beat) => {
    const left = offset;
    offset += beatCellWidth(beat.duration);
    return left;
  });
}

/** Which column a pointer at `x` (px from the measure's left edge) is over. */
export function beatIndexAtX(beats: TablatureBeat[], x: number): number {
  const offsets = beatCellOffsets(beats);
  for (let beatIdx = beats.length - 1; beatIdx >= 0; beatIdx--) {
    if (x >= offsets[beatIdx]) return beatIdx;
  }
  return 0;
}
