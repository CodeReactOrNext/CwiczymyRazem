import { describe, expect, it } from "vitest";

import {
  AT_REST,
  clampPan,
  clampZoom,
  FIT_ZOOM,
  MAX_ZOOM,
  panForZoom,
  pinchSpan,
  settleView,
} from "./boardZoom";

describe("clampZoom", () => {
  it("never shrinks the board below life size", () => {
    expect(clampZoom(0.4)).toBe(1);
  });

  it("stops at the far end of the range", () => {
    expect(clampZoom(12)).toBe(MAX_ZOOM);
  });

  it("leaves anything inside the range alone", () => {
    expect(clampZoom(1.75)).toBe(1.75);
  });

  it("goes under life size only where the window allows it", () => {
    expect(clampZoom(0.5, FIT_ZOOM)).toBe(FIT_ZOOM);
    expect(clampZoom(0.2, FIT_ZOOM)).toBe(FIT_ZOOM);
  });
});

describe("pinchSpan", () => {
  it("measures the gap between two fingers", () => {
    expect(pinchSpan({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("panForZoom", () => {
  it("holds the pinched point still while the board grows", () => {
    // A board at rest, pinched 200px in from the window's edge, doubled.
    const x = panForZoom(0, 200, 1, 2);
    // The content under 200 was at 200; at 2x it sits at 400, so the board has
    // to back off by 200 for the player to still be looking at it.
    expect(x).toBe(-200);
  });

  it("holds it still on the way back down too", () => {
    expect(panForZoom(-200, 200, 2, 1)).toBe(0);
  });

  it("leaves the board where it is when the zoom does not change", () => {
    expect(panForZoom(-137, 88, 2, 2)).toBe(-137);
  });
});

describe("clampPan", () => {
  it("centres a board smaller than the window it is seen through", () => {
    expect(clampPan(-50, 400, 300)).toBe(50);
  });

  it("pins a life-size board to the window exactly", () => {
    expect(clampPan(-20, 400, 400)).toBe(0);
  });

  it("refuses to pull the board past its own leading edge", () => {
    expect(clampPan(60, 400, 800)).toBe(0);
  });

  it("refuses to push it past its trailing edge", () => {
    expect(clampPan(-900, 400, 800)).toBe(-400);
  });

  it("allows everything in between", () => {
    expect(clampPan(-250, 400, 800)).toBe(-250);
  });
});

describe("settleView", () => {
  const window = { width: 400, height: 200 };
  const size = { width: 400, height: 200 };

  it("leaves a board at rest sitting square in its window", () => {
    expect(settleView(AT_REST, window, size)).toEqual({ zoom: 1, x: 0, y: 0 });
  });

  it("brings a board pushed too far back against its edges", () => {
    expect(settleView({ zoom: 2, x: 400, y: -900 }, window, size)).toEqual({
      zoom: 2,
      x: 0,
      y: -200,
    });
  });
});
