import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { createTempoRulerFromMeasures } from "../hooks/tempoBeatClock";
import { tabPlayUntil } from "./tabPlayUntil";

/** A 4/4 bar of four quarter notes. */
const bar = (tempoChange?: number): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: Array.from({ length: 4 }, () => ({ duration: 1, notes: [] })),
  ...(tempoChange !== undefined && { tempoChange }),
});

const until = (measures: TablatureMeasure[], bpm: number, endSec: number, marginSec?: number) =>
  tabPlayUntil(measures, createTempoRulerFromMeasures(measures), bpm, endSec, marginSec);

describe("tabPlayUntil", () => {
  // 60 BPM: a beat is a second, a bar four seconds, the two-bar tab eight.
  const twoBars = [bar(), bar()];

  it("stops at the last bar that ends a second before the time is up", () => {
    // 21 s → bars must end by 20 s → 5 bars (two and a half passes).
    expect(until(twoBars, 60, 21)).toEqual({ beat: 20, warped: 20 });
    // 18.5 s → limit 17.5 s → the bar ending at 20 s no longer fits; the one
    // ending at 16 s leaves 2.5 s of silence, which is short enough.
    expect(until(twoBars, 60, 18.5)).toEqual({ beat: 16, warped: 16 });
  });

  it("stops inside a bar when the last bar line leaves over three seconds of silence", () => {
    // 20.5 s → the bar line at 16 s would leave 4.5 s → the beat ending at 19 s.
    expect(until(twoBars, 60, 20.5)).toEqual({ beat: 19, warped: 19 });
    // 40 BPM: a beat is 1.5 s, a bar 6 s. 11.5 s → bar line at 6 s leaves 5.5 s
    // → the last beat ending by 10.5 s is the 7th (10.5 s).
    expect(until(twoBars, 40, 11.5)).toEqual({ beat: 7, warped: 7 });
  });

  it("falls back to note ends when a whole beat is still too early", () => {
    // 20 BPM: a beat is 3 s. Sixteenths: 0.75 s each, sixteen to the bar.
    const sixteenths: TablatureMeasure[] = [{
      timeSignature: [4, 4],
      beats: Array.from({ length: 16 }, () => ({ duration: 0.25, notes: [] })),
    }];
    // 15.9 s → limit 14.9 s. Bar line 12 s (3.9 s left), beat line 12 s too
    // → the last sixteenth ending by 14.9 s ends at 14.25 s = 4.75 beats.
    expect(until(sixteenths, 20, 15.9)).toEqual({ beat: 4.75, warped: 4.75 });
  });

  it("never leaves more than three seconds while notes are shorter than two", () => {
    const sixteenths: TablatureMeasure[] = [0, 1, 2].map(() => ({
      timeSignature: [4, 4] as [number, number],
      beats: Array.from({ length: 16 }, () => ({ duration: 0.25, notes: [] })),
    }));
    for (const bpm of [40, 60, 100]) {
      for (let endSec = 5; endSec < 125; endSec += 0.37) {
        const cut = until(sixteenths, bpm, endSec)!;
        const silence = endSec - cut.warped / (bpm / 60);
        expect(silence).toBeLessThanOrEqual(3 + 1e-6);
        expect(silence).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("lets a whole pass that ends right on time through without the margin", () => {
    // A song slot sized to one pass of its tab keeps that pass's last bar.
    expect(until(twoBars, 60, 8)).toEqual({ beat: 8, warped: 8 });
    expect(until(twoBars, 60, 8.4)).toEqual({ beat: 8, warped: 8 });
  });

  it("cuts everything when not even one bar fits", () => {
    expect(until(twoBars, 60, 3)).toEqual({ beat: 0, warped: 0 });
  });

  it("follows the tempo", () => {
    // 120 BPM: a bar is two seconds. 11 s → bars ending by 10 s → 5 bars.
    expect(until(twoBars, 120, 11)).toEqual({ beat: 20, warped: 20 });
  });

  it("measures bars in warped beats under tempo automation", () => {
    // The second bar is twice as fast: 4 score beats take 2 warped beats.
    const measures = [bar(), bar(2)];
    // One pass = 6 s at 60 BPM. 11 s → limit 10 s → pass 1 (6 s) + bar 1 (4 s).
    expect(until(measures, 60, 11)).toEqual({ beat: 12, warped: 10 });
  });

  it("has nothing to cut against without bars or tempo", () => {
    expect(until([], 60, 10)).toBeNull();
    expect(until(twoBars, 0, 10)).toBeNull();
  });
});
