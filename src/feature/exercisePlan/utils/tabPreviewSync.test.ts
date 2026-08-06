import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { createMeasure } from "./measureGrid";
import {
  beatAtScrollLeft,
  beatRangeForCells,
  type MeasureBox,
} from "./tabPreviewSync";

// 16 sixteenth-note cells of 32px each → 512px per 4/4 bar, matching the grid.
const CELL = 32;
const BAR_WIDTH = 16 * CELL;

const bars = (count: number): TablatureMeasure[] =>
  Array.from({ length: count }, () => createMeasure());

const boxes = (count: number, gap = 0): MeasureBox[] =>
  Array.from({ length: count }, (_, i) => ({
    left: i * (BAR_WIDTH + gap),
    width: BAR_WIDTH,
  }));

describe("beatAtScrollLeft", () => {
  it("maps the unscrolled grid to the start of the piece", () => {
    expect(beatAtScrollLeft(0, bars(3), boxes(3))).toBe(0);
  });

  it("maps a cell boundary to that cell's position in quarter notes", () => {
    // 4 cells in = one quarter note; a full bar in = 4 quarter notes.
    expect(beatAtScrollLeft(4 * CELL, bars(3), boxes(3))).toBeCloseTo(1);
    expect(beatAtScrollLeft(BAR_WIDTH, bars(3), boxes(3))).toBeCloseTo(4);
    expect(
      beatAtScrollLeft(BAR_WIDTH + 8 * CELL, bars(3), boxes(3)),
    ).toBeCloseTo(6);
  });

  it("interpolates inside a cell", () => {
    expect(beatAtScrollLeft(CELL / 2, bars(1), boxes(1))).toBeCloseTo(0.125);
  });

  it("accounts for the separators between measures", () => {
    const gap = 2;
    expect(
      beatAtScrollLeft(BAR_WIDTH + gap, bars(3), boxes(3, gap)),
    ).toBeCloseTo(4);
  });

  it("follows a mixed grid where cells are wider than a sixteenth", () => {
    // A bar of 8 eighth notes: one cell is half a quarter note.
    const measures = [createMeasure([4, 4], 8)];
    const layout: MeasureBox[] = [{ left: 0, width: 8 * CELL }];
    expect(beatAtScrollLeft(2 * CELL, measures, layout)).toBeCloseTo(1);
  });

  it("handles varying time signatures", () => {
    const measures = [createMeasure([3, 4], 12), createMeasure([4, 4], 16)];
    const layout: MeasureBox[] = [
      { left: 0, width: 12 * CELL },
      { left: 12 * CELL, width: BAR_WIDTH },
    ];
    // The 3/4 bar is 3 quarters long, so the second bar starts at 3.
    expect(beatAtScrollLeft(12 * CELL, measures, layout)).toBeCloseTo(3);
  });

  it("clamps past the end of the piece", () => {
    expect(beatAtScrollLeft(99999, bars(2), boxes(2))).toBeCloseTo(8);
  });

  it("skips measures whose box hasn't been laid out yet", () => {
    const measures = bars(2);
    const layout = [
      { left: 0, width: 0 },
      { left: 0, width: BAR_WIDTH },
    ];
    expect(beatAtScrollLeft(0, measures, layout)).toBeCloseTo(4);
  });
});

describe("beatRangeForCells", () => {
  it("spans exactly one cell when given one", () => {
    expect(beatRangeForCells(bars(2), 0, 4, 4)).toEqual({
      startBeat: 1,
      endBeat: 1.25,
    });
  });

  it("offsets by the measures before it", () => {
    expect(beatRangeForCells(bars(3), 2, 0, 0)).toEqual({
      startBeat: 8,
      endBeat: 8.25,
    });
  });

  it("spans a run of cells", () => {
    expect(beatRangeForCells(bars(1), 0, 2, 5)).toEqual({
      startBeat: 0.5,
      endBeat: 1.5,
    });
  });

  it("takes the cells in either order", () => {
    expect(beatRangeForCells(bars(1), 0, 5, 2)).toEqual(
      beatRangeForCells(bars(1), 0, 2, 5),
    );
  });

  it("respects measures of different lengths", () => {
    const measures = [createMeasure([3, 4], 12), createMeasure([4, 4], 16)];
    expect(beatRangeForCells(measures, 1, 0, 0)).toEqual({
      startBeat: 3,
      endBeat: 3.25,
    });
  });

  it("clamps a cell index past the end of the measure", () => {
    expect(beatRangeForCells(bars(1), 0, 14, 99)).toEqual({
      startBeat: 3.5,
      endBeat: 4,
    });
  });

  it("returns null for a measure that no longer exists", () => {
    expect(beatRangeForCells(bars(1), 3, 0, 0)).toBeNull();
  });
});
