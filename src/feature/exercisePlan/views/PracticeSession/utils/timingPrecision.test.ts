import { describe, expect, it } from "vitest";

import { MIN_TIMED_NOTES, summarizeTimingOffsets } from "./timingPrecision";

describe("summarizeTimingOffsets", () => {
  it("reads the typical distance and the lean off the offsets", () => {
    expect(
      summarizeTimingOffsets([-20, -10, -10, 0, 10, 20, 30, 40, -30]),
    ).toEqual({
      medianOffsetMs: 20,
      biasMs: 0,
      measuredNotes: 9,
    });
  });

  it("tells a run that rushes from one that drags", () => {
    expect(summarizeTimingOffsets(Array(10).fill(-25))?.biasMs).toBe(-25);
    expect(summarizeTimingOffsets(Array(10).fill(25))?.biasMs).toBe(25);
  });

  it("isn't moved by a single wild attack", () => {
    const offsets = [...Array(9).fill(10), 400];
    expect(summarizeTimingOffsets(offsets)?.medianOffsetMs).toBe(10);
  });

  it("says nothing about a run with too few timed notes", () => {
    expect(
      summarizeTimingOffsets(Array(MIN_TIMED_NOTES - 1).fill(5)),
    ).toBeNull();
  });
});
