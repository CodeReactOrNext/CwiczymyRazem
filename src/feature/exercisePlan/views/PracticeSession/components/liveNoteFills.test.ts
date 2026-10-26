import { describe, expect, it } from "vitest";

import type { FillStep } from "../utils/fillFeed";
import type { NoteTiming } from "../utils/timingGrade";
import { addFillSteps, clearLiveFills, createLiveFills, currentTiming, isLiveTiming, liveFillBeat, liveFillOn } from "./liveNoteFills";

const LATE: NoteTiming = { grade: 2, hint: "late", offsetBeats: 0.1 };
const onTile = (tile: number) => () => tile;
const hit = (noteKey: string, audioSec: number, beat: number, timing: NoteTiming = LATE): FillStep =>
  ({ noteKey, audioSec, beat, hit: true, timing });
const hold = (noteKey: string, audioSec: number, beat: number): FillStep => ({ noteKey, audioSec, beat });

describe("liveNoteFills", () => {
  it("draws the fill between the steps around the moment, at the steps' own pace", () => {
    const fills = createLiveFills();
    addFillSteps(fills, [hit("0-0-0", 1.0, 0.1), hold("0-0-0", 1.1, 0.2), hold("0-0-0", 1.2, 0.3)], onTile(0), 0, null);
    const fill = liveFillOn(fills, "0-0-0", 0)!;

    expect(liveFillBeat(fill, 0.95)).toBeCloseTo(0.1, 9); // the hit, before it is due
    expect(liveFillBeat(fill, 1.05)).toBeCloseTo(0.15, 9);
    expect(liveFillBeat(fill, 1.15)).toBeCloseTo(0.25, 9);
    // Past the last step the note stopped ringing — the fill stays there.
    expect(liveFillBeat(fill, 1.5)).toBeCloseTo(0.3, 9);
    expect(liveFillBeat(fill, 9)).toBeCloseTo(0.3, 9);
  });

  it("grows evenly however the steps bunch up", () => {
    const fills = createLiveFills();
    // A tick every ~16 ms, but currentTime only moves every 10 ms.
    const steps: FillStep[] = [hit("k", 0, 0)];
    for (let tick = 1; tick < 40; tick++) {
      const audioSec = Math.floor((tick * 16.7) / 10) / 100;
      steps.push(hold("k", audioSec, audioSec * 2));
    }
    addFillSteps(fills, steps, onTile(0), 0, null);
    const fill = liveFillOn(fills, "k", 0)!;

    const shown: number[] = [];
    for (let frame = 0; frame < 30; frame++) shown.push(liveFillBeat(fill, frame / 60));
    const growth = shown.slice(1).map((beat, i) => beat - shown[i]);
    for (const step of growth) expect(step).toBeCloseTo(2 / 60, 6);
  });

  it("never draws a fill back", () => {
    const fills = createLiveFills();
    addFillSteps(fills, [hit("k", 1, 0.5), hold("k", 1.1, 0.6)], onTile(0), 0, null);
    const fill = liveFillOn(fills, "k", 0)!;
    expect(liveFillBeat(fill, 1.1)).toBeCloseTo(0.6, 9);
    expect(liveFillBeat(fill, 1.0)).toBeCloseTo(0.6, 9);
  });

  it("shows all it got while there is no clock (paused)", () => {
    const fills = createLiveFills();
    addFillSteps(fills, [hit("k", 1, 0.5), hold("k", 1.1, 0.6)], onTile(0), 0, null);
    expect(liveFillBeat(liveFillOn(fills, "k", 0)!, null)).toBeCloseTo(0.6, 9);
  });

  it("folds two steps read off the same audio callback into one", () => {
    const fills = createLiveFills();
    addFillSteps(fills, [hit("k", 1, 0.5), hold("k", 1, 0.5), hold("k", 1.01, 0.51)], onTile(0), 0, null);
    const fill = liveFillOn(fills, "k", 0)!;
    expect(fill.samples).toHaveLength(2);
    expect(liveFillBeat(fill, 1.005)).toBeCloseTo(0.505, 9);
  });

  it("keeps a fill to the tile it was played on, and starts it over on the next pass", () => {
    const fills = createLiveFills();
    let tile = 0;
    const hits = addFillSteps(fills, [hit("k", 1, 0.5)], () => tile, 100, null);
    expect(hits.map((step) => step.noteKey)).toEqual(["k"]);
    expect(liveFillOn(fills, "k", 0)?.hitAt).toBe(100);
    expect(liveFillOn(fills, "k", 1)).toBeUndefined();

    tile = 1;
    addFillSteps(fills, [hit("k", 5, 0.52)], () => tile, 4100, null);
    expect(liveFillOn(fills, "k", 0)).toBeUndefined();
    expect(liveFillOn(fills, "k", 1)?.hitAt).toBe(4100);
    expect(liveFillBeat(liveFillOn(fills, "k", 1)!, 5)).toBeCloseTo(0.52, 9);
  });

  it("picks up a hold with no hit of its own (the board was reset mid-note) without a flash", () => {
    const fills = createLiveFills();
    const hits = addFillSteps(fills, [hold("k", 1, 0.7)], onTile(0), 100, null);
    expect(hits).toEqual([]);
    expect(liveFillOn(fills, "k", 0)?.hitAt).toBeNull();
    expect(liveFillOn(fills, "k", 0)?.timing).toBeNull();
  });

  it("draws far enough behind the clock for steps to be in on time, and comes back down", () => {
    const fills = createLiveFills();
    addFillSteps(fills, [hit("k", 1, 0)], onTile(0), 0, 1.07);
    expect(fills.delaySec).toBeCloseTo(0.07 + 1 / 60, 9);
    for (let i = 0; i < 2000; i++) addFillSteps(fills, [hold("k", 2 + i, i)], onTile(0), 0, 2 + i);
    expect(fills.delaySec).toBeCloseTo(0.025, 9);
    addFillSteps(fills, [hold("k", 5000, 1)], onTile(0), 0, 5001);
    expect(fills.delaySec).toBeCloseTo(0.12, 9);
  });

  it("forgets every fill on a reset", () => {
    const fills = createLiveFills();
    addFillSteps(fills, [hit("k", 1, 0.5)], onTile(0), 0, null);
    clearLiveFills(fills);
    expect(liveFillOn(fills, "k", 0)).toBeUndefined();
  });

  it("shows the hit's own timing until React's copy describes the same hit", () => {
    const fills = createLiveFills();
    addFillSteps(fills, [hit("k", 1, 0.5, LATE)], onTile(0), 0, null);
    const fill = liveFillOn(fills, "k", 0);
    const lastPass: NoteTiming = { grade: 3, hint: null, offsetBeats: 0, intonation: { grade: 1, cents: 30 } };
    const settled: NoteTiming = { ...LATE, intonation: { grade: 3, cents: 2 } };

    expect(currentTiming(undefined, fill)).toBe(LATE);
    expect(currentTiming(lastPass, fill)).toBe(LATE);
    expect(currentTiming(settled, fill)).toBe(settled);
    expect(currentTiming(lastPass, undefined)).toBe(lastPass);
    expect(isLiveTiming(fill, { ...LATE })).toBe(true);
    expect(isLiveTiming(fill, lastPass)).toBe(false);
  });
});
