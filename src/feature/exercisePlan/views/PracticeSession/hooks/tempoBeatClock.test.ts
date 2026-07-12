import { describe, expect, it } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import { buildTempoMap, createBeatClock } from "./tempoBeatClock";

const measure = (durations: number[], tempoChange?: number): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: durations.map(d => ({ duration: d, notes: [] })),
  ...(tempoChange !== undefined ? { tempoChange } : {}),
});

describe("buildTempoMap", () => {
  it("returns an empty map when no measure carries a tempo change", () => {
    expect(buildTempoMap([measure([1, 1, 1, 1]), measure([1, 1, 1, 1])])).toEqual([]);
  });

  it("anchors tempo points at cumulative beat positions", () => {
    const map = buildTempoMap([
      measure([1, 1, 1, 1], 1.0),
      measure([1, 1, 1, 1]),
      measure([1, 1, 1, 1], 0.5),
    ]);
    expect(map).toEqual([
      { beatPos: 0, ratio: 1.0 },
      { beatPos: 8, ratio: 0.5 },
    ]);
  });
});

describe("createBeatClock", () => {
  it("is linear at constant tempo", () => {
    const clock = createBeatClock([], 8, 120); // 2 beats/s
    expect(clock.loopSeconds).toBeCloseTo(4);
    expect(clock.toBeats(0)).toBeCloseTo(0);
    expect(clock.toBeats(1.5)).toBeCloseTo(3);
    expect(clock.toBeats(5)).toBeCloseTo(10); // keeps growing across the loop
  });

  it("extrapolates pre-roll (negative elapsed) linearly", () => {
    const clock = createBeatClock([{ beatPos: 0, ratio: 1 }], 8, 60);
    expect(clock.toBeats(-0.5)).toBeCloseTo(-0.5);
  });

  it("follows tempo segments like the viewer cursor", () => {
    // 8 beats total: first 4 at 60 BPM (4s), last 4 at 120 BPM (2s) → 6s loop
    const clock = createBeatClock(
      [{ beatPos: 0, ratio: 1 }, { beatPos: 4, ratio: 2 }],
      8,
      60,
    );
    expect(clock.loopSeconds).toBeCloseTo(6);
    expect(clock.toBeats(2)).toBeCloseTo(2);   // inside slow segment
    expect(clock.toBeats(4)).toBeCloseTo(4);   // segment boundary
    expect(clock.toBeats(5)).toBeCloseTo(6);   // 1s into fast segment = 2 beats
    expect(clock.toBeats(6)).toBeCloseTo(8);   // end of first pass
    expect(clock.toBeats(8)).toBeCloseTo(10);  // 2s into the second loop = beat 2
  });

  it("diverges from a constant-BPM clock as the song advances", () => {
    // This is the drift the matcher used to accumulate on GP files with tempo
    // automation: constant-BPM mapping vs the real tempo curve.
    const clock = createBeatClock(
      [{ beatPos: 0, ratio: 1 }, { beatPos: 4, ratio: 2 }],
      8,
      60,
    );
    const constantBps = 1; // 60 BPM
    expect(Math.abs(clock.toBeats(2) - 2 * constantBps)).toBeCloseTo(0);
    expect(Math.abs(clock.toBeats(6) - 6 * constantBps)).toBeCloseTo(2);
  });
});
