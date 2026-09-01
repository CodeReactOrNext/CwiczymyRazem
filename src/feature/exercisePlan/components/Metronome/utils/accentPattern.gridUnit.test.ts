import { describe, expect, it } from "vitest";

import { MAX_BEATS_PER_BAR, stepsPerBeat, subdivisionCountFor } from "./accentPattern";
import { getCountInDurationMs } from "./countInDuration";

describe("stepsPerBeat", () => {
  it("is one entry per beat on a quarter grid and two on an eighth grid", () => {
    expect(stepsPerBeat(4)).toBe(1);
    expect(stepsPerBeat(8)).toBe(2);
  });
});

describe("subdivisionCountFor", () => {
  it("leaves a quarter grid's subdivision exactly as the player set it", () => {
    for (const subdivision of [1, 2, 3, 4]) {
      expect(subdivisionCountFor(subdivision, 4)).toBe(subdivision);
    }
  });

  it("gives an eighth grid at least two ticks a beat, so every entry has one to sound on", () => {
    expect(subdivisionCountFor(1, 8)).toBe(2);
    expect(subdivisionCountFor(2, 8)).toBe(2);
    expect(subdivisionCountFor(4, 8)).toBe(4);
  });

  it("doubles an odd subdivision rather than dropping entries between ticks", () => {
    // Triplets become sextuplets: 3 ticks a beat cannot place an eighth, 6 can.
    expect(subdivisionCountFor(3, 8)).toBe(6);
  });

  it("always divides evenly into whole ticks per grid entry", () => {
    for (const unit of [4, 8] as const) {
      for (const subdivision of [1, 2, 3, 4]) {
        const ticksPerStep = subdivisionCountFor(subdivision, unit) / stepsPerBeat(unit);
        expect(Number.isInteger(ticksPerStep)).toBe(true);
      }
    }
  });
});

describe("bar length ceiling", () => {
  it("holds the longest pair the odd-meter drills need — 8/8 answered by 8/8", () => {
    expect(MAX_BEATS_PER_BAR).toBeGreaterThanOrEqual(16);
  });
});

describe("getCountInDurationMs", () => {
  it("is unchanged for the quarter grid every existing exercise uses", () => {
    expect(getCountInDurationMs(4, 60)).toBe(4000);
    expect(getCountInDurationMs(4, 60, 4)).toBe(4000);
  });

  it("counts an eighth grid in eighths, so one bar still lasts one bar", () => {
    // 8 eighths at quarter=60 is four beats — the same 4s as a 4-entry quarter grid.
    expect(getCountInDurationMs(8, 60, 8)).toBe(4000);
    // A 7/8 bar is three and a half beats, and counts in for exactly that long.
    expect(getCountInDurationMs(7, 60, 8)).toBe(3500);
  });
});
