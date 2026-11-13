import { describe, expect, it } from "vitest";

import { canvasContentWidth, drawRepBar, fitSlotWidth, slotScale, swingDirection } from "./strumming.canvas";
import { HEAD_HALF_W, MIN_SLOT_W, PAD, REP_CURRENT, REP_DONE } from "./strumming.constants";

/** 4/4 in 16ths — the funk patterns, the widest bar the app ships. */
const FUNK_SLOTS = 16;
/** 4/4 in 8ths — every other strumming exercise. */
const EIGHTHS_SLOTS = 8;

const barWidth = (viewW: number, slots: number) => 2 * PAD + slots * fitSlotWidth(viewW, slots);

describe("strumming bar sizing", () => {
  it("fits a 16th-note bar inside a phone viewport", () => {
    for (const viewW of [320, 343, 360, 390, 412]) {
      expect(barWidth(viewW, FUNK_SLOTS)).toBeLessThanOrEqual(viewW + 1);
      expect(canvasContentWidth(viewW, FUNK_SLOTS)).toBe(viewW);
    }
  });

  it("keeps slots at least MIN_SLOT_W wide", () => {
    expect(fitSlotWidth(120, FUNK_SLOTS)).toBe(MIN_SLOT_W);
  });

  it("widens the canvas past the viewport once slots hit the floor, so it scrolls", () => {
    const viewW = 120;
    const content = canvasContentWidth(viewW, FUNK_SLOTS);
    expect(content).toBeGreaterThan(viewW);
    expect(content).toBeGreaterThanOrEqual(2 * PAD + FUNK_SLOTS * MIN_SLOT_W);
  });

  it("re-derives the same slot width from the canvas width it produced", () => {
    for (const viewW of [120, 320, 360, 800]) {
      const content = canvasContentWidth(viewW, FUNK_SLOTS);
      expect(fitSlotWidth(content, FUNK_SLOTS)).toBeCloseTo(fitSlotWidth(viewW, FUNK_SLOTS), 0);
    }
  });

  it("lets slots grow on a wide desktop pane", () => {
    expect(fitSlotWidth(900, EIGHTHS_SLOTS)).toBeGreaterThan(64);
    expect(canvasContentWidth(900, EIGHTHS_SLOTS)).toBe(900);
  });

  it("guards against a pattern with no slots", () => {
    expect(fitSlotWidth(360, 0)).toBe(MIN_SLOT_W);
    expect(canvasContentWidth(360, 0)).toBe(360);
  });
});

describe("slotScale", () => {
  it("draws arrows at full size once slots are comfortable", () => {
    expect(slotScale(34)).toBe(1);
    expect(slotScale(64)).toBe(1);
  });

  it("shrinks arrows on narrow slots without collapsing them", () => {
    expect(slotScale(20)).toBeLessThan(1);
    expect(slotScale(MIN_SLOT_W)).toBeGreaterThanOrEqual(0.6);
    expect(slotScale(4)).toBe(0.6);
  });

  it("keeps an arrow head inside its own slot", () => {
    for (const slotW of [MIN_SLOT_W, 20, 24, 34, 64]) {
      const headWidth = 2 * HEAD_HALF_W * slotScale(slotW);
      expect(headWidth).toBeLessThanOrEqual(slotW);
    }
  });
});

describe("swingDirection", () => {
  it("alternates down and up through 8ths and 16ths alike", () => {
    expect([0, 1, 2, 3].map(swingDirection)).toEqual(["down", "up", "down", "up"]);
  });
});

describe("drawRepBar", () => {
  const rects = (maxReps: number, currentRep: number, progress: number) => {
    const out: { x: number; w: number; color: string }[] = [];
    let fillStyle = "";
    const ctx = {
      beginPath: () => {}, fill: () => {},
      roundRect: (x: number, _y: number, w: number) => out.push({ x, w, color: fillStyle }),
      set fillStyle(v: string) { fillStyle = v; },
    } as unknown as CanvasRenderingContext2D;
    drawRepBar(ctx, currentRep, progress, maxReps, 360, 0);
    return out;
  };

  it("draws a segment per rep and fills the current one", () => {
    const out = rects(10, 2, 0.5);
    expect(out).toHaveLength(11); // ten segments + the current rep's fill
    expect(out.filter((r) => r.color === REP_DONE)).toHaveLength(2);
    expect(out.filter((r) => r.color === REP_CURRENT)).toHaveLength(1);
    expect(Math.max(...out.map((r) => r.x + r.w))).toBeLessThanOrEqual(360 - PAD + 0.001);
  });

  it("falls back to one continuous bar for a very long set", () => {
    expect(rects(200, 100, 0)).toHaveLength(2);
  });
});
