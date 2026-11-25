import { describe, expect, it } from "vitest";

import { getRunVerdict, isPlanHalfway, weakestMeasure } from "./runVerdict";
import type { RunNote } from "./timingGrade";

const bar = (measure: number, hits: number, misses: number): RunNote[] => [
  ...Array.from({ length: hits }, () => ({ hit: true, timingMs: 0, cents: null, measure })),
  ...Array.from({ length: misses }, () => ({ hit: false, timingMs: null, cents: null, measure })),
];

describe("weakestMeasure", () => {
  it("picks the bar with the lowest hit rate", () => {
    expect(weakestMeasure([...bar(0, 8, 0), ...bar(1, 5, 3), ...bar(2, 2, 6)])).toBe(2);
  });

  it("stays quiet when every bar went well enough", () => {
    expect(weakestMeasure([...bar(0, 8, 0), ...bar(1, 7, 1)])).toBeNull();
  });

  it("does not judge a bar on a note or two", () => {
    expect(weakestMeasure([...bar(0, 8, 0), ...bar(1, 0, 2)])).toBeNull();
  });

  it("adds up the passes of a looping tab", () => {
    expect(weakestMeasure([...bar(0, 4, 0), ...bar(1, 0, 2), ...bar(0, 4, 0), ...bar(1, 1, 1)])).toBe(1);
  });

  it("has nothing to single out in a one-bar tab, or without bars", () => {
    expect(weakestMeasure(bar(0, 0, 8))).toBeNull();
    expect(weakestMeasure([{ hit: false, timingMs: null, cents: null }])).toBeNull();
    expect(weakestMeasure(null)).toBeNull();
  });
});

describe("getRunVerdict", () => {
  it("only confirms the time when nothing was tracked or heard", () => {
    expect(getRunVerdict(null)).toEqual({ kind: "time" });
    expect(getRunVerdict({ accuracy: 0, maxCombo: 0, noteLog: bar(0, 0, 8) })).toEqual({ kind: "time" });
  });

  it("calls 90% and up clean", () => {
    expect(getRunVerdict({ accuracy: 90, maxCombo: 31 })).toEqual({ kind: "clean", accuracy: 90, streak: 31 });
  });

  it("names the weak bar of a rough run", () => {
    expect(getRunVerdict({ accuracy: 70, maxCombo: 9, noteLog: [...bar(0, 8, 0), ...bar(1, 2, 6)] })).toEqual({
      kind: "rough", accuracy: 70, streak: 9, weakMeasure: 1,
    });
  });
});

describe("isPlanHalfway", () => {
  it("is true once, at the middle of a plan of four or more", () => {
    expect([0, 1, 2, 3].map((i) => isPlanHalfway(i, 4))).toEqual([false, true, false, false]);
    expect([0, 1, 2, 3, 4].map((i) => isPlanHalfway(i, 5))).toEqual([false, false, true, false, false]);
  });

  it("never stops a short plan", () => {
    expect([0, 1, 2].some((i) => isPlanHalfway(i, 3))).toBe(false);
  });
});
