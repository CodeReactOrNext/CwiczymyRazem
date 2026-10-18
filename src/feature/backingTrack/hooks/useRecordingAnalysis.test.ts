import { describe, expect, it } from "vitest";

import { mixPeaks } from "./useRecordingAnalysis";

const peaksOf = (...values: number[]) => Float32Array.from(values);

describe("mixPeaks", () => {
  it("draws nothing without a decoded layer", () => {
    expect(mixPeaks([], 100)).toBeNull();
  });

  it("hands a lone, unshifted layer straight back", () => {
    const only = peaksOf(0.1, 0.5);
    expect(mixPeaks([{ peaks: only, offsetMs: 0 }], 100)).toBe(only);
  });

  it("keeps the loudest layer in every bucket", () => {
    const mixed = mixPeaks(
      [
        { peaks: peaksOf(0.2, 0.9, 0.1), offsetMs: 0 },
        { peaks: peaksOf(0.5, 0.3, 0.4), offsetMs: 0 },
      ],
      100,
    );
    expect(Array.from(mixed ?? [])).toEqual([0.5, 0.9, 0.4].map(Math.fround));
  });

  it("places a shifted layer where it actually plays", () => {
    // 20 ms later at 100 buckets a second is two buckets to the right.
    const mixed = mixPeaks(
      [
        { peaks: peaksOf(0.1, 0.1), offsetMs: 0 },
        { peaks: peaksOf(0.8), offsetMs: 20 },
      ],
      100,
    );
    expect(Array.from(mixed ?? [])).toEqual([0.1, 0.1, 0.8].map(Math.fround));
  });
});
