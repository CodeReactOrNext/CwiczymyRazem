import { describe, expect, it } from "vitest";

import { gradeTiming, TIMING_GRADE_POINTS, timingHintFor, timingWindowsFor } from "./timingGrade";

/** One sixteenth at `bpm`, in ms. */
const sixteenth = (bpm: number) => 60000 / bpm / 4;

describe("timingWindowsFor", () => {
  it("caps the windows on long notes", () => {
    // A quarter at 60 BPM — a full second.
    expect(timingWindowsFor(1000)).toEqual({ onTimeMs: 130, closeMs: 230 });
  });

  it("scales with the note in between", () => {
    // Sixteenths at 120 BPM — 125 ms.
    expect(timingWindowsFor(sixteenth(120))).toEqual({ onTimeMs: 105, closeMs: 180 });
  });

  it("never drops below the measurement error, however short the note", () => {
    expect(timingWindowsFor(sixteenth(220))).toEqual({ onTimeMs: 100, closeMs: 170 });
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
    expect(gradeTiming(130, 1000)).toBe(3);
    expect(gradeTiming(230, 1000)).toBe(2);
  });

  it("gives full marks when the attack could not be measured", () => {
    expect(gradeTiming(null, 500)).toBe(3);
  });
});

describe("timingHintFor", () => {
  it("gives a + to any attack within 80 ms, either side", () => {
    expect(timingHintFor(0)).toBe("perfect");
    expect(timingHintFor(-80)).toBe("perfect");
    expect(timingHintFor(80)).toBe("perfect");
  });

  it("says nothing between the + and a plain slip, whatever the grade", () => {
    expect(timingHintFor(81)).toBeNull();
    expect(timingHintFor(-180)).toBeNull();
    expect(gradeTiming(150, 500)).toBe(2);
    expect(timingHintFor(150)).toBeNull();
  });

  it("calls early or late only past 180 ms", () => {
    expect(timingHintFor(181)).toBe("late");
    expect(timingHintFor(-181)).toBe("early");
  });

  it("never hands a + to a hit graded below 3", () => {
    // The tightest "on time" window is wider than the +.
    expect(gradeTiming(80, sixteenth(220))).toBe(3);
  });

  it("never labels an unmeasured attack", () => {
    expect(timingHintFor(null)).toBeNull();
  });

  it("leaves the score alone — a + is still an ordinary 3", () => {
    expect(gradeTiming(40, 500)).toBe(3);
  });
});

describe("TIMING_GRADE_POINTS", () => {
  it("pays a 3 in full and less for each grade below", () => {
    expect(TIMING_GRADE_POINTS[3]).toBe(1);
    expect(TIMING_GRADE_POINTS[2]).toBeLessThan(1);
    expect(TIMING_GRADE_POINTS[1]).toBeLessThan(TIMING_GRADE_POINTS[2]);
  });
});
