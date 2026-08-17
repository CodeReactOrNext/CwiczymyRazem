import { describe, expect, it } from "vitest";

import { DOUBLE_COUNT_IN_BPM, getCountInBeats, getCountInDurationMs } from "./countInDuration";

describe("getCountInBeats", () => {
  it("counts in one bar below the fast-tempo threshold", () => {
    expect(getCountInBeats(4, 60)).toBe(4);
    expect(getCountInBeats(3, DOUBLE_COUNT_IN_BPM - 1)).toBe(3);
  });

  it("counts in two bars from the fast-tempo threshold up", () => {
    expect(getCountInBeats(4, DOUBLE_COUNT_IN_BPM)).toBe(8);
    expect(getCountInBeats(4, 180)).toBe(8);
    expect(getCountInBeats(3, 160)).toBe(6);
  });

  it("uses the effective (speed-scaled) tempo it is given", () => {
    // 160 bpm slowed to 0.5x is really 80 bpm → back to a single bar.
    expect(getCountInBeats(4, 160 * 0.5)).toBe(4);
  });

  it("counts in at least one beat", () => {
    expect(getCountInBeats(0, 60)).toBe(1);
    expect(getCountInBeats(4, Number.NaN)).toBe(4);
  });
});

describe("getCountInDurationMs", () => {
  it("returns one beat per meter beat at the given tempo", () => {
    expect(getCountInDurationMs(4, 60)).toBe(4000);
    expect(getCountInDurationMs(3, 100)).toBe(1800);
  });

  it("covers the doubled count-in at fast tempos", () => {
    // 8 beats at 160 bpm = 3000ms, not the 1500ms a single bar would give.
    expect(getCountInDurationMs(4, 160)).toBe(3000);
  });

  it("uses the effective (speed-scaled) tempo it is given", () => {
    // 100 bpm at 0.75x → 75 bpm → 4 beats = 3200ms
    expect(getCountInDurationMs(4, 100 * 0.75)).toBe(3200);
  });

  it("counts in at least one beat", () => {
    expect(getCountInDurationMs(0, 60)).toBe(1000);
  });

  it("returns 0 for a missing or nonsensical tempo", () => {
    expect(getCountInDurationMs(4, 0)).toBe(0);
    expect(getCountInDurationMs(4, Number.NaN)).toBe(0);
  });
});
