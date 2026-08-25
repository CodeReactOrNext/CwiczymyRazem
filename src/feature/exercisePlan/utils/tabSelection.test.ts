import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  cellSelection,
  clearSelectedNotes,
  countSelectedNotes,
  isCellInSelection,
  mapSelectedNotes,
  normalizeSelection,
  selectedBeatIndices,
  selectionBeatRefs,
} from "./tabSelection";

/** Four beats per bar, one note per beat, all on the string given. */
const bar = (frets: number[], string = 1): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: frets.map((fret) => ({
    duration: 1,
    notes: [{ string, fret }],
  })),
});

const twoBars = () => [bar([0, 1, 2, 3]), bar([4, 5, 6, 7])];

const span = (
  startMeasure: number,
  startBeat: number,
  endMeasure: number,
  endBeat: number,
  startString = 0,
  endString = 5,
) => ({ startMeasure, startBeat, endMeasure, endBeat, startString, endString });

describe("normalizeSelection", () => {
  it("keeps a beat with the measure it was anchored in", () => {
    expect(normalizeSelection(span(2, 1, 0, 3))).toMatchObject({
      firstMeasure: 0,
      firstBeat: 3,
      lastMeasure: 2,
      lastBeat: 1,
    });
  });

  it("orders the strings independently", () => {
    expect(normalizeSelection(span(0, 0, 0, 1, 4, 2))).toMatchObject({
      firstString: 2,
      lastString: 4,
    });
  });
});

describe("selectionBeatRefs", () => {
  it("runs from the first beat to the last, across the bar line", () => {
    expect(selectionBeatRefs(twoBars(), span(0, 2, 1, 1))).toEqual([
      { measureIdx: 0, beatIdx: 2 },
      { measureIdx: 0, beatIdx: 3 },
      { measureIdx: 1, beatIdx: 0 },
      { measureIdx: 1, beatIdx: 1 },
    ]);
  });

  it("covers whole measures in between", () => {
    const measures = [...twoBars(), bar([8, 9, 10, 11])];
    expect(selectionBeatRefs(measures, span(0, 3, 2, 0))).toHaveLength(6);
  });

  it("skips beats a re-grid has taken away", () => {
    expect(selectionBeatRefs(twoBars(), span(0, 0, 5, 9))).toHaveLength(8);
  });

  it("is empty without a selection", () => {
    expect(selectionBeatRefs(twoBars(), null)).toEqual([]);
  });
});

describe("selectedBeatIndices", () => {
  it("picks out one measure's share of the selection", () => {
    expect(selectedBeatIndices(twoBars(), span(0, 2, 1, 1), 1)).toEqual([0, 1]);
  });
});

describe("isCellInSelection", () => {
  it("bounds the strings on every measure it covers", () => {
    const selection = span(0, 0, 1, 3, 1, 2);
    expect(isCellInSelection(selection, 1, 3, 2)).toBe(true);
    expect(isCellInSelection(selection, 1, 3, 3)).toBe(false);
    expect(isCellInSelection(selection, 2, 0, 1)).toBe(false);
  });

  it("treats a click as a one-cell selection", () => {
    const selection = cellSelection({
      measureIdx: 1,
      beatIdx: 2,
      stringIdx: 3,
    });
    expect(isCellInSelection(selection, 1, 2, 3)).toBe(true);
    expect(isCellInSelection(selection, 1, 2, 4)).toBe(false);
  });
});

describe("mapSelectedNotes", () => {
  it("rewrites every covered note and leaves other measures identity-equal", () => {
    const measures = twoBars();
    const next = mapSelectedNotes(measures, span(1, 0, 1, 1), (note) => ({
      ...note,
      isPalmMute: true,
    }));

    expect(next[0]).toBe(measures[0]);
    expect(next[1].beats.map((b) => !!b.notes[0].isPalmMute)).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });

  it("ignores notes on strings outside the selection", () => {
    const measures = [bar([0, 1, 2, 3], 6)];
    const next = mapSelectedNotes(measures, span(0, 0, 0, 3, 0, 2), (note) => ({
      ...note,
      isAccented: true,
    }));

    expect(next[0]).toBe(measures[0]);
  });
});

describe("clearSelectedNotes", () => {
  it("leaves the covered beats as rests", () => {
    const next = clearSelectedNotes(twoBars(), span(0, 2, 1, 0));

    expect(next[0].beats.map((b) => b.notes.length)).toEqual([1, 1, 0, 0]);
    expect(next[1].beats.map((b) => b.notes.length)).toEqual([0, 1, 1, 1]);
  });
});

describe("countSelectedNotes", () => {
  it("counts the notes, not the beats", () => {
    expect(countSelectedNotes(twoBars(), span(0, 0, 1, 3))).toBe(8);
    expect(countSelectedNotes(twoBars(), span(0, 0, 0, 3, 1, 5))).toBe(0);
  });
});
