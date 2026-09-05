import { describe, expect, it } from "vitest";

import { COUNT_IN_BEATS, DOUBLE_COUNT_IN_BPM, getCountInBeats, getCountInDurationMs } from "./countInDuration";

describe("getCountInBeats", () => {
  it("counts in one plain 4/4 bar below the fast-tempo threshold", () => {
    expect(COUNT_IN_BEATS).toBe(4);
    expect(getCountInBeats(60)).toBe(4);
    expect(getCountInBeats(DOUBLE_COUNT_IN_BPM - 1)).toBe(4);
  });

  it("counts in two bars from the fast-tempo threshold up", () => {
    expect(getCountInBeats(DOUBLE_COUNT_IN_BPM)).toBe(8);
    expect(getCountInBeats(180)).toBe(8);
  });

  it("uses the effective (speed-scaled) tempo it is given", () => {
    // 160 bpm slowed to 0.5x is really 80 bpm → back to a single bar.
    expect(getCountInBeats(160 * 0.5)).toBe(4);
  });

  it("ignores the exercise's own meter entirely", () => {
    // A drill alternating 12/8 and 4/4 used to count itself in for twenty clicks,
    // because the count-in walked the exercise's click grid. Four, always.
    expect(getCountInBeats(60)).toBe(4);
    expect(getCountInBeats(Number.NaN)).toBe(4);
  });
});

describe("getCountInDurationMs", () => {
  it("is four quarter notes at the given tempo", () => {
    expect(getCountInDurationMs(60)).toBe(4000);
    expect(getCountInDurationMs(120 - 1)).toBeCloseTo((4 * 60_000) / 119, 5);
  });

  it("covers the doubled count-in at fast tempos", () => {
    // 8 beats at 160 bpm = 3000ms, not the 1500ms a single bar would give.
    expect(getCountInDurationMs(160)).toBe(3000);
  });

  it("uses the effective (speed-scaled) tempo it is given", () => {
    // 100 bpm at 0.75x → 75 bpm → 4 beats = 3200ms
    expect(getCountInDurationMs(100 * 0.75)).toBe(3200);
  });

  it("returns 0 for a missing or nonsensical tempo", () => {
    expect(getCountInDurationMs(0)).toBe(0);
    expect(getCountInDurationMs(Number.NaN)).toBe(0);
  });
});
