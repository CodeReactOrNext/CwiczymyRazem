import { describe, expect, it } from "vitest";

import {
  clampCentre,
  clampWindow,
  MAX_WINDOW_SEC,
  MIN_WINDOW_SEC,
  secAtPixel,
  wheelZoomFactor,
  zoomAround,
} from "./timelineView";

describe("clampWindow", () => {
  it("keeps a sane zoom inside its range", () => {
    expect(clampWindow(4)).toBe(4);
    expect(clampWindow(0.01)).toBe(MIN_WINDOW_SEC);
    expect(clampWindow(9999)).toBe(MAX_WINDOW_SEC);
  });

  it("falls back rather than propagating nonsense", () => {
    expect(clampWindow(Number.NaN)).toBe(4);
  });
});

describe("zoomAround", () => {
  const view = { windowSec: 10, centreSec: 50 };

  it("holds the anchored moment exactly still", () => {
    // The whole point: the transient under the pointer must not move.
    for (const anchor of [45, 50, 53.7]) {
      const next = zoomAround(view, anchor, 0.5);
      const before = (anchor - view.centreSec) / view.windowSec;
      const after = (anchor - next.centreSec) / next.windowSec;
      expect(after).toBeCloseTo(before);
    }
  });

  it("zooms in and out by the factor asked for", () => {
    expect(zoomAround(view, 50, 0.5).windowSec).toBeCloseTo(5);
    expect(zoomAround(view, 50, 2).windowSec).toBeCloseTo(20);
  });

  it("leaves the centre alone when the anchor is the centre", () => {
    expect(zoomAround(view, 50, 0.5).centreSec).toBeCloseTo(50);
  });

  it("stops at the zoom limits instead of running away", () => {
    expect(zoomAround(view, 50, 0.0001).windowSec).toBe(MIN_WINDOW_SEC);
    expect(zoomAround(view, 50, 10_000).windowSec).toBe(MAX_WINDOW_SEC);
  });

  it("keeps the anchor still even when the zoom is clamped", () => {
    const next = zoomAround({ windowSec: 1, centreSec: 10 }, 10.4, 0.0001);
    const before = (10.4 - 10) / 1;
    const after = (10.4 - next.centreSec) / next.windowSec;
    expect(after).toBeCloseTo(before);
  });

  it("ignores an anchor that isn't a number", () => {
    const next = zoomAround(view, Number.NaN, 0.5);
    expect(next.centreSec).toBe(50);
    expect(next.windowSec).toBeCloseTo(5);
  });
});

describe("clampCentre", () => {
  it("allows the very start to be brought to the middle", () => {
    // The tab's start marker lives at second 0 and has to be draggable there.
    expect(clampCentre(0, 10, 200)).toBe(0);
    expect(clampCentre(-4, 10, 200)).toBe(-4);
  });

  it("stops the view drifting off either end", () => {
    expect(clampCentre(-100, 10, 200)).toBe(-5);
    expect(clampCentre(1000, 10, 200)).toBe(205);
  });

  it("does not fence anything in before the length is known", () => {
    expect(clampCentre(500, 10, 0)).toBe(500);
  });
});

describe("secAtPixel", () => {
  it("reads the left edge, middle and right edge", () => {
    const view = { laneWidthPx: 1000, windowSec: 10, centreSec: 50 };
    expect(secAtPixel({ ...view, pixelX: 0 })).toBeCloseTo(45);
    expect(secAtPixel({ ...view, pixelX: 500 })).toBeCloseTo(50);
    expect(secAtPixel({ ...view, pixelX: 1000 })).toBeCloseTo(55);
  });

  it("falls back to the centre before the lane has been laid out", () => {
    expect(secAtPixel({ pixelX: 10, laneWidthPx: 0, windowSec: 10, centreSec: 50 })).toBe(50);
  });
});

describe("wheelZoomFactor", () => {
  it("zooms out scrolling down and in scrolling up", () => {
    expect(wheelZoomFactor(100)).toBeGreaterThan(1);
    expect(wheelZoomFactor(-100)).toBeLessThan(1);
  });

  it("is symmetric, so a scroll and its reverse come back to the same place", () => {
    expect(wheelZoomFactor(100) * wheelZoomFactor(-100)).toBeCloseTo(1);
  });

  it("caps one violent flick rather than crossing the whole range", () => {
    // Mice report deltas in the hundreds and trackpads in single digits; the
    // sign is the instruction, the size only a hint.
    expect(wheelZoomFactor(100_000)).toBeLessThanOrEqual(wheelZoomFactor(300) + 1e-9);
  });

  it("still responds to a trackpad's tiny deltas", () => {
    expect(wheelZoomFactor(4)).toBeGreaterThan(1);
  });

  it("does nothing on a zero or nonsense delta", () => {
    expect(wheelZoomFactor(0)).toBe(1);
    expect(wheelZoomFactor(Number.NaN)).toBe(1);
  });
});
