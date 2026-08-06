import { describe, expect, it } from "vitest";

import { getCountInDurationMs } from "./countInDuration";

describe("getCountInDurationMs", () => {
  it("returns one beat per meter beat at the given tempo", () => {
    expect(getCountInDurationMs(4, 60)).toBe(4000);
    expect(getCountInDurationMs(3, 120)).toBe(1500);
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
