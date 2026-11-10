import { describe, expect, it } from "vitest";

import { PAGE_LEAD, pagedScrollX, pageStartAt, pageStarts } from "./tabPaging";

/** Bars 200 px long. */
const bars = (count: number) => Array.from({ length: count }, (_, i) => (i + 1) * 200);

describe("pageStarts", () => {
  it("cuts pages at barlines, leaving the next page's start in view", () => {
    // 1000 px of board: five bars would fill it to the edge, so a page is four.
    expect(pageStarts(bars(10), 2000, 1000)).toEqual([0, 800, 1600]);
  });

  it("keeps a bar that fits the board whole even when nothing can show after it", () => {
    expect(pageStarts(bars(4), 800, 230)).toEqual([0, 200, 400, 600]);
  });

  it("cuts a bar wider than the board where the page runs out", () => {
    const starts = pageStarts([1000], 1000, 300);
    expect(starts.length).toBeGreaterThan(2);
    starts.slice(1).forEach((start, i) => {
      expect(start - starts[i]).toBeGreaterThan(0);
      expect(start - starts[i]).toBeLessThanOrEqual(300 - PAGE_LEAD);
    });
  });

  it("is a single page for a tab that fits, an empty tab, or a board with no width", () => {
    expect(pageStarts(bars(2), 400, 1000)).toEqual([0]);
    expect(pageStarts([], 0, 1000)).toEqual([0]);
    expect(pageStarts(bars(4), 800, 0)).toEqual([0]);
  });
});

describe("pagedScrollX", () => {
  const starts = [0, 600, 1200, 1800];

  it("finds the page a position is on", () => {
    expect(pageStartAt(starts, 0)).toBe(0);
    expect(pageStartAt(starts, 599.9)).toBe(0);
    expect(pageStartAt(starts, 600)).toBe(600);
    expect(pageStartAt(starts, 5000)).toBe(1800);
  });

  it("stands still across a page and moves on only at its end", () => {
    expect(pagedScrollX(starts, 0, 10)).toBe(0);
    expect(pagedScrollX(starts, 0, 590)).toBe(0);
    expect(pagedScrollX(starts, 0, 610)).toBe(600 - PAGE_LEAD);
    expect(pagedScrollX(starts, 0, 1190)).toBe(600 - PAGE_LEAD);
  });

  it("pages every pass of a looping tab the same way", () => {
    expect(pagedScrollX(starts, 2000, 10)).toBe(2000 - PAGE_LEAD);
    expect(pagedScrollX(starts, 2000, 700)).toBe(2600 - PAGE_LEAD);
  });
});
