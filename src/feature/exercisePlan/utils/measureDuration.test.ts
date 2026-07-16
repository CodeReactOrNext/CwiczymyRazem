import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  beatsDurationInQuarters,
  isMeasureComplete,
  measureDurationError,
  measureDurationInQuarters,
  stepsForDuration,
} from "./measureDuration";

const measure = (
  timeSignature: [number, number],
  durations: number[],
): TablatureMeasure => ({
  timeSignature,
  beats: durations.map((duration) => ({ duration, notes: [] })),
});

const uniform = (
  timeSignature: [number, number],
  steps: number,
): TablatureMeasure =>
  measure(
    timeSignature,
    Array.from(
      { length: steps },
      () => measureDurationInQuarters(timeSignature) / steps,
    ),
  );

describe("measureDurationInQuarters", () => {
  it("measures common signatures in quarter notes", () => {
    expect(measureDurationInQuarters([4, 4])).toBe(4);
    expect(measureDurationInQuarters([3, 4])).toBe(3);
    expect(measureDurationInQuarters([2, 4])).toBe(2);
    expect(measureDurationInQuarters([5, 4])).toBe(5);
    expect(measureDurationInQuarters([6, 8])).toBe(3);
    expect(measureDurationInQuarters([7, 8])).toBe(3.5);
  });
});

describe("beatsDurationInQuarters", () => {
  it("sums beat durations", () => {
    expect(beatsDurationInQuarters([])).toBe(0);
    expect(
      beatsDurationInQuarters([
        { duration: 1, notes: [] },
        { duration: 0.5, notes: [] },
        { duration: 0.25, notes: [] },
      ]),
    ).toBe(1.75);
  });
});

describe("isMeasureComplete", () => {
  it("accepts a measure whose beats fill the signature", () => {
    expect(isMeasureComplete(uniform([4, 4], 16))).toBe(true);
    expect(isMeasureComplete(uniform([3, 4], 12))).toBe(true);
    expect(isMeasureComplete(uniform([7, 8], 7))).toBe(true);
  });

  it("tolerates the rounding error of a sextuplet grid", () => {
    // 24 × (4/24) sums to 3.9999999999999982 — exact comparison would fail here.
    const sextuplets = uniform([4, 4], 24);
    expect(beatsDurationInQuarters(sextuplets.beats)).not.toBe(4);
    expect(isMeasureComplete(sextuplets)).toBe(true);
  });

  it("rejects a 16-step measure whose beats were all set to quarter notes", () => {
    // The bug this guards: 16 steps × quarter = four bars of material in one bar.
    expect(isMeasureComplete(measure([4, 4], Array(16).fill(1)))).toBe(false);
  });

  it("rejects a 4/4 grid left on a measure retyped as 3/4", () => {
    expect(isMeasureComplete(measure([3, 4], Array(16).fill(0.25)))).toBe(
      false,
    );
  });
});

describe("measureDurationError", () => {
  it("signs the error by direction", () => {
    expect(measureDurationError(measure([4, 4], [1, 1]))).toBe(-2);
    expect(measureDurationError(measure([4, 4], Array(5).fill(1)))).toBe(1);
  });
});

describe("stepsForDuration", () => {
  it("tiles signatures that divide evenly", () => {
    expect(stepsForDuration([4, 4], 1)).toBe(4);
    expect(stepsForDuration([4, 4], 0.25)).toBe(16);
    expect(stepsForDuration([3, 4], 0.5)).toBe(6);
    expect(stepsForDuration([6, 8], 0.125)).toBe(24);
  });

  it("rounds signatures that cannot be tiled, keeping at least one step", () => {
    // 7/8 is 3.5 quarters — quarter notes don't tile it.
    expect(stepsForDuration([7, 8], 1)).toBe(4);
    expect(stepsForDuration([2, 4], 4)).toBe(1);
  });
});
