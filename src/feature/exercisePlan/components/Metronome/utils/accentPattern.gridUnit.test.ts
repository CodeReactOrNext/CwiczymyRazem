import { describe, expect, it } from "vitest";

import { MAX_BEATS_PER_BAR, stepsPerBeat, subdivisionCountFor } from "./accentPattern";
import { getCountInDurationMs } from "./countInDuration";
import { MAX_GRID_ENTRIES } from "./meterGrid";

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
  it("caps the +/- control well below what a derived grid may hold", () => {
    // MAX_BEATS_PER_BAR is only what a player can build by hand. A grid read off a
    // tab that alternates meters is longer — 12/8 answered by 4/4 is twenty entries
    // — and is measured against MAX_GRID_ENTRIES instead.
    expect(MAX_BEATS_PER_BAR).toBeGreaterThanOrEqual(16);
    expect(MAX_GRID_ENTRIES).toBeGreaterThan(MAX_BEATS_PER_BAR);
  });
});

describe("getCountInDurationMs", () => {
  it("is four quarter notes whatever grid the exercise is clicked on", () => {
    // The count-in used to walk the exercise's own grid, which made an eighth-grid
    // drill count itself in in eighths and a two-bar cycle count in for both bars.
    expect(getCountInDurationMs(60)).toBe(4000);
    expect(getCountInDurationMs(120)).toBe(4000);
  });
});
