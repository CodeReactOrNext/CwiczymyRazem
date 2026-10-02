import { describe, expect, it } from "vitest";

import { gradeTiming, isPerfectTiming, TIMING_GRADE_POINTS, timingWindowsFor } from "./timingGrade";

/** One sixteenth at `bpm`, in ms. */
const sixteenth = (bpm: number) => 60000 / bpm / 4;

describe("timingWindowsFor", () => {
  it("caps the windows on long notes", () => {
    // A quarter at 60 BPM — a full second.
    expect(timingWindowsFor(1000)).toEqual({ onTimeMs: 100, closeMs: 200 });
  });

  it("scales with the note in between", () => {
    // Sixteenths at 120 BPM — 125 ms.
    expect(timingWindowsFor(sixteenth(120))).toEqual({ onTimeMs: 75, closeMs: 150 });
  });

  it("never drops below the measurement error, however short the note", () => {
    expect(timingWindowsFor(sixteenth(220))).toEqual({ onTimeMs: 70, closeMs: 140 });
  });
});

describe("gradeTiming", () => {
  it("leaves room for the hand and the measurement on a 3", () => {
    // Off by a few ms of detector error plus a human wobble — still on time.
    expect(gradeTiming(90, 500)).toBe(3);
    expect(gradeTiming(-65, sixteenth(180))).toBe(3);
  });

  it("gives a 2 for a little off, a 1 for clearly off", () => {
    expect(gradeTiming(150, 500)).toBe(2);
    expect(gradeTiming(250, 500)).toBe(1);
  });

  it("costs the same early as late", () => {
    expect(gradeTiming(-150, 500)).toBe(gradeTiming(150, 500));
    expect(gradeTiming(-250, 500)).toBe(gradeTiming(250, 500));
  });

  it("grades on the window edges inclusively", () => {
    expect(gradeTiming(100, 1000)).toBe(3);
    expect(gradeTiming(200, 1000)).toBe(2);
  });

  it("gives full marks when the attack could not be measured", () => {
    expect(gradeTiming(null, 500)).toBe(3);
  });
});

describe("isPerfectTiming", () => {
  it("rewards an attack dead on the beat, with a human margin either side", () => {
    expect(isPerfectTiming(0)).toBe(true);
    expect(isPerfectTiming(-20)).toBe(true);
    expect(isPerfectTiming(25)).toBe(true);
  });

  it("keeps a merely good hit an ordinary 3", () => {
    expect(isPerfectTiming(40)).toBe(false);
    expect(gradeTiming(40, 500)).toBe(3);
  });

  it("never calls an unmeasured attack perfect", () => {
    expect(isPerfectTiming(null)).toBe(false);
  });
});

describe("TIMING_GRADE_POINTS", () => {
  it("pays a 3 in full and less for each grade below", () => {
    expect(TIMING_GRADE_POINTS[3]).toBe(1);
    expect(TIMING_GRADE_POINTS[2]).toBeLessThan(1);
    expect(TIMING_GRADE_POINTS[1]).toBeLessThan(TIMING_GRADE_POINTS[2]);
  });
});
