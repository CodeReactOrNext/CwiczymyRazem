import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { isMeasureComplete, stepsForDuration } from "./measureDuration";
import { createMeasure, regridMeasure } from "./measureGrid";

const TIME_SIGNATURES: [number, number][] = [
  [4, 4],
  [3, 4],
  [2, 4],
  [5, 4],
  [6, 8],
  [7, 8],
];
const STEP_OPTIONS = [8, 12, 16, 24, 32];
const DURATIONS = [1, 0.5, 0.25, 0.125];

describe("createMeasure", () => {
  it("defaults to a 16-step 4/4 bar", () => {
    const measure = createMeasure();
    expect(measure.timeSignature).toEqual([4, 4]);
    expect(measure.beats).toHaveLength(16);
    expect(measure.beats.every((b) => b.duration === 0.25)).toBe(true);
    expect(isMeasureComplete(measure)).toBe(true);
  });

  it("fills every signature the editor offers", () => {
    for (const ts of TIME_SIGNATURES) {
      for (const steps of STEP_OPTIONS) {
        expect(isMeasureComplete(createMeasure(ts, steps))).toBe(true);
      }
    }
  });
});

describe("regridMeasure", () => {
  const measure: TablatureMeasure = {
    timeSignature: [4, 4],
    beats: [
      { duration: 0.25, notes: [{ string: 6, fret: 3 }] },
      { duration: 0.25, notes: [] },
      { duration: 0.25, notes: [{ string: 5, fret: 5 }] },
      { duration: 0.25, notes: [] },
    ],
  };

  it("keeps notes that still fit the grid", () => {
    const regridded = regridMeasure(measure, [4, 4], 8);
    expect(regridded.beats).toHaveLength(8);
    expect(regridded.beats[0].notes).toEqual([{ string: 6, fret: 3 }]);
    expect(regridded.beats[2].notes).toEqual([{ string: 5, fret: 5 }]);
    expect(regridded.beats[7].notes).toEqual([]);
  });

  it("drops notes that fall outside a shrinking grid", () => {
    const regridded = regridMeasure(measure, [4, 4], 2);
    expect(regridded.beats).toHaveLength(2);
    expect(regridded.beats[0].notes).toEqual([{ string: 6, fret: 3 }]);
    expect(regridded.beats.flatMap((b) => b.notes)).toHaveLength(1);
  });

  it("re-derives durations when the signature changes", () => {
    // The old code kept duration at 4/steps regardless of signature, so a 3/4
    // bar on a 16-step grid summed to 4 quarter notes instead of 3.
    const threeFour = regridMeasure(measure, [3, 4], 16);
    expect(threeFour.timeSignature).toEqual([3, 4]);
    expect(threeFour.beats.every((b) => b.duration === 3 / 16)).toBe(true);
    expect(isMeasureComplete(threeFour)).toBe(true);
  });

  it("leaves no signature/step combination short or overflowing", () => {
    for (const ts of TIME_SIGNATURES) {
      for (const steps of STEP_OPTIONS) {
        expect(isMeasureComplete(regridMeasure(measure, ts, steps))).toBe(true);
      }
    }
  });

  it("stays valid for every grid-resolution button, in every signature", () => {
    // Guards the toolbar: resolution → step count → duration must round-trip
    // back to a full bar, including 7/8 which quarter notes can't tile.
    for (const ts of TIME_SIGNATURES) {
      for (const duration of DURATIONS) {
        const regridded = regridMeasure(
          measure,
          ts,
          stepsForDuration(ts, duration),
        );
        expect(isMeasureComplete(regridded)).toBe(true);
      }
    }
  });

  it("preserves unrelated measure fields", () => {
    const flagged: TablatureMeasure = { ...measure, firstLoopOnly: true };
    expect(regridMeasure(flagged, [4, 4], 8).firstLoopOnly).toBe(true);
  });
});
