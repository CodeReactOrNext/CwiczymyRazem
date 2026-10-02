import { describe, expect, it } from "vitest";

import { tempoScoreFactor } from "./tempoScoreFactor";

describe("tempoScoreFactor", () => {
  it("pays base points at 100 BPM", () => {
    expect(tempoScoreFactor(100)).toBe(1);
  });

  it("pays more per note the faster the tempo", () => {
    expect(tempoScoreFactor(50)).toBeCloseTo(0.841, 3);
    expect(tempoScoreFactor(80)).toBeCloseTo(0.946, 3);
    expect(tempoScoreFactor(160)).toBeCloseTo(1.125, 3);
  });

  it("makes a doubled tempo worth ~2.4x over a timed run", () => {
    // Twice the notes in the same minutes, each worth 2^¼ more.
    const timedRun = (bpm: number) => bpm * tempoScoreFactor(bpm);
    expect(timedRun(160) / timedRun(80)).toBeCloseTo(2.38, 2);
  });

  it("falls back to base points without a tempo", () => {
    expect(tempoScoreFactor(0)).toBe(1);
  });
});
