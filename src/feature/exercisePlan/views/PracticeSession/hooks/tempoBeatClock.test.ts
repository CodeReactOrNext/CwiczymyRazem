import { describe, expect, it } from "vitest";

import type { TablatureMeasure } from "../../../types/exercise.types";
import {
  buildTempoMap,
  createBeatClock,
  createTempoRuler,
  createTempoRulerFromMeasures,
} from "./tempoBeatClock";

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

describe("createTempoRuler", () => {
  it("is the identity when nothing is automated", () => {
    const ruler = createTempoRuler([], 8);
    expect(ruler.isConstant).toBe(true);
    expect(ruler.toWarped(5)).toBeCloseTo(5);
    expect(ruler.fromWarped(5)).toBeCloseTo(5);
    expect(ruler.totalWarped).toBeCloseTo(8);
    expect(ruler.ratioAt(3)).toBe(1);
  });

  it("charges a fast bar less time than a slow one", () => {
    // 8 beats: first 4 at ratio 1, last 4 at ratio 2 (double speed).
    const ruler = createTempoRuler(
      [{ beatPos: 0, ratio: 1 }, { beatPos: 4, ratio: 2 }],
      8,
    );
    expect(ruler.toWarped(4)).toBeCloseTo(4);
    expect(ruler.toWarped(6)).toBeCloseTo(5); // 2 beats at double speed = 1
    expect(ruler.totalWarped).toBeCloseTo(6);
  });

  it("agrees with the cursor clock about where a beat lands in time", () => {
    // The ruler and createBeatClock must never disagree, or the notes would
    // sound somewhere other than where the cursor draws them.
    const map = [{ beatPos: 0, ratio: 1 }, { beatPos: 4, ratio: 2 }];
    const bpm = 60;
    const ruler = createTempoRuler(map, 8);
    const clock = createBeatClock(map, 8, bpm);
    for (const beat of [0, 1, 3.5, 4, 5, 7, 8]) {
      const seconds = ruler.toWarped(beat) * (60 / bpm);
      expect(clock.toBeats(seconds)).toBeCloseTo(beat);
    }
    expect(ruler.totalWarped * (60 / bpm)).toBeCloseTo(clock.loopSeconds);
  });

  it("round-trips through warped space", () => {
    const ruler = createTempoRuler(
      [{ beatPos: 0, ratio: 0.75 }, { beatPos: 4, ratio: 1.5 }, { beatPos: 12, ratio: 1 }],
      16,
    );
    for (const beat of [0, 2, 4, 9, 12, 16]) {
      expect(ruler.fromWarped(ruler.toWarped(beat))).toBeCloseTo(beat);
    }
  });

  it("leaves bars before the first marker at the base tempo", () => {
    const ruler = createTempoRuler([{ beatPos: 4, ratio: 2 }], 8);
    expect(ruler.ratioAt(0)).toBe(1);
    expect(ruler.toWarped(8)).toBeCloseTo(6);
  });

  it("extrapolates pre-roll at the opening tempo", () => {
    const ruler = createTempoRuler([{ beatPos: 0, ratio: 2 }], 8);
    expect(ruler.toWarped(-1)).toBeCloseTo(-0.5);
  });

  it("ignores a nonsense ratio rather than poisoning the clock with NaN", () => {
    const ruler = createTempoRuler([{ beatPos: 0, ratio: 0 }], 4);
    expect(ruler.toWarped(4)).toBeCloseTo(4);
    expect(Number.isFinite(ruler.totalWarped)).toBe(true);
  });

  it("builds straight from measures", () => {
    const ruler = createTempoRulerFromMeasures([
      measure([1, 1, 1, 1]),
      measure([1, 1, 1, 1], 2),
    ]);
    expect(ruler.totalWarped).toBeCloseTo(6);
    expect(ruler.ratioAt(5)).toBe(2);
  });
});
