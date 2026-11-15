import { describe, expect, it } from "vitest";

import { fitInside, planTakeFrame, sourceBox } from "./takeFrame";

describe("planTakeFrame", () => {
  it("puts the board alone in a padded frame with even sides", () => {
    const plan = planTakeFrame({ width: 801, height: 301 }, null, 1);
    expect(plan.score).toBeNull();
    expect(plan.board).toEqual({ x: 12, y: 12, width: 801, height: 301 });
    expect(plan.width).toBe(824);
    expect(plan.height).toBe(324);
    expect(plan.width % 2).toBe(0);
    expect(plan.height % 2).toBe(0);
  });

  it("stacks the score above the board, against its right edge", () => {
    const plan = planTakeFrame({ width: 1000, height: 300 }, { width: 340, height: 100 }, 1);
    expect(plan.score).toEqual({ x: 12 + 1000 - 340, y: 12, width: 340, height: 100 });
    expect(plan.board).toEqual({ x: 12, y: 124, width: 1000, height: 300 });
    expect(plan.height).toBe(436);
  });

  it("uses the capture's own pixels on a dense screen", () => {
    const plan = planTakeFrame({ width: 800, height: 300 }, null, 2);
    expect(plan.board).toEqual({ x: 24, y: 24, width: 1600, height: 600 });
  });

  it("scales an ultrawide board down to the widest picture allowed", () => {
    const plan = planTakeFrame({ width: 3300, height: 400 }, { width: 340, height: 100 }, 1);
    expect(plan.width).toBeLessThanOrEqual(1920);
    expect(plan.width).toBeGreaterThan(1900);
    expect(planTakeFrame({ width: 1160, height: 300 }, null, 2).width).toBeLessThanOrEqual(1920);
    // Everything shrinks by the same factor.
    expect(plan.board.width / plan.board.height).toBeCloseTo(3300 / 400, 1);
    expect(plan.score!.width / plan.board.width).toBeCloseTo(340 / 3300, 2);
  });
});

describe("fitInside", () => {
  it("fills a slot of the same shape", () => {
    expect(fitInside({ width: 200, height: 100 }, { x: 10, y: 20, width: 400, height: 200 })).toEqual({
      x: 10,
      y: 20,
      width: 400,
      height: 200,
    });
  });

  it("centres a source of another shape without stretching it", () => {
    // The board grew taller mid-take: it is shown whole, with bars either side.
    expect(fitInside({ width: 100, height: 100 }, { x: 0, y: 0, width: 400, height: 200 })).toEqual({
      x: 100,
      y: 0,
      width: 200,
      height: 200,
    });
  });

  it("draws nothing for an empty source", () => {
    expect(fitInside({ width: 0, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }).width).toBe(0);
  });
});

describe("sourceBox", () => {
  const frame = { width: 2000, height: 1000 };

  it("maps a page rectangle to captured pixels", () => {
    expect(sourceBox({ x: 100, y: 50, width: 400, height: 200 }, 2, frame)).toEqual({
      x: 200,
      y: 100,
      width: 800,
      height: 400,
    });
  });

  it("clips to the frame and gives up on what is off screen", () => {
    expect(sourceBox({ x: -50, y: 400, width: 200, height: 200 }, 2, frame)).toEqual({
      x: 0,
      y: 800,
      width: 300,
      height: 200,
    });
    expect(sourceBox({ x: 1200, y: 0, width: 100, height: 100 }, 2, frame)).toBeNull();
  });
});
