import { describe, expect, it } from "vitest";

import type { SpacedBeat } from "./tabSpacing";
import { beatToX, buildBeatXMap, DEFAULT_PILL_METRICS, minBeatWidth, xToBeat } from "./tabSpacing";

const note = (fret: number) => ({ fret });

/** Beats laid end to end, the way the render data lists them. */
function beatsOf(...specs: [duration: number, frets: number[]][]): SpacedBeat[] {
  let offsetX = 0;
  return specs.map(([duration, frets]) => {
    const beat = { offsetX, duration, notes: frets.map(note) };
    offsetX += duration;
    return beat;
  });
}

const total = (beats: SpacedBeat[]) => beats.reduce((sum, b) => sum + b.duration, 0);

describe("buildBeatXMap", () => {
  it("is plain time × beat width when every pill fits", () => {
    const beats = beatsOf([1, [5]], [0.5, [7]], [0.5, []], [2, [12]]);
    const map = buildBeatXMap(beats, total(beats), 200, DEFAULT_PILL_METRICS);

    for (const beat of [0, 0.25, 1, 1.5, 2, 3.3, 4]) expect(beatToX(map, beat)).toBeCloseTo(beat * 200);
    expect(map.totalX).toBe(800);
  });

  it("gives each note of a fast run at least its pill's room, and leaves the rest of the bar alone", () => {
    // A quarter, then six sextuplet sixteenths with two-digit frets, at a zoomed-out 100 px per beat.
    const beats = beatsOf([1, [9]], ...Array.from({ length: 6 }, (): [number, number[]] => [1 / 6, [11]]), [1, [9]]);
    const map = buildBeatXMap(beats, total(beats), 100, DEFAULT_PILL_METRICS);
    const need = minBeatWidth(beats[1], DEFAULT_PILL_METRICS);
    expect(need).toBeGreaterThan(100 / 6);

    for (let i = 1; i <= 6; i++) expect(map.xs[i + 1] - map.xs[i]).toBeCloseTo(need);
    // The quarters either side keep their linear width.
    expect(map.xs[1] - map.xs[0]).toBe(100);
    expect(map.xs[8] - map.xs[7]).toBe(100);
  });

  it("stretches only beats with notes — a short rest needs no pill room", () => {
    const beats = beatsOf([0.125, []], [0.125, [3]]);
    const map = buildBeatXMap(beats, total(beats), 100, DEFAULT_PILL_METRICS);
    expect(map.xs[1] - map.xs[0]).toBeCloseTo(12.5);
    expect(map.xs[2] - map.xs[1]).toBeCloseTo(minBeatWidth(beats[1], DEFAULT_PILL_METRICS));
  });

  it("needs more room for bigger pills and longer fret numbers", () => {
    const one = { offsetX: 0, duration: 0.1, notes: [note(5)] };
    const two = { offsetX: 0, duration: 0.1, notes: [note(15)] };
    expect(minBeatWidth(two, DEFAULT_PILL_METRICS)).toBeGreaterThan(minBeatWidth(one, DEFAULT_PILL_METRICS));
    expect(minBeatWidth(one, { pillHeight: 30, fretFontScale: 1 })).toBeGreaterThan(minBeatWidth(one, DEFAULT_PILL_METRICS));
    expect(minBeatWidth(one, { pillHeight: 22, fretFontScale: 1.5 })).toBeGreaterThan(minBeatWidth(one, DEFAULT_PILL_METRICS));
  });

  it("keeps a song that runs past its last beat linear to the end", () => {
    const beats = beatsOf([1, [0]]);
    const map = buildBeatXMap(beats, 4, 150, DEFAULT_PILL_METRICS);
    expect(map.totalX).toBe(600);
    expect(beatToX(map, 2.5)).toBeCloseTo(375);
  });

  it("is linear for a board with no beats at all", () => {
    const map = buildBeatXMap([], 1, 120, DEFAULT_PILL_METRICS);
    expect(beatToX(map, 0.5)).toBeCloseTo(60);
    expect(map.totalX).toBe(120);
  });
});

describe("beatToX / xToBeat", () => {
  const beats = beatsOf([1, [9]], [0.125, [11]], [0.125, [12]], [0.25, []], [0, [5]], [1.5, [7]]);
  const map = buildBeatXMap(beats, total(beats), 80, DEFAULT_PILL_METRICS);

  it("undo each other along the whole song", () => {
    for (let beat = 0; beat <= total(beats); beat += 0.0625) {
      expect(xToBeat(map, beatToX(map, beat))).toBeCloseTo(beat);
    }
  });

  it("never runs backwards", () => {
    let prev = -Infinity;
    for (let beat = -1; beat <= total(beats) + 1; beat += 0.01) {
      const x = beatToX(map, beat);
      expect(x).toBeGreaterThanOrEqual(prev);
      prev = x;
    }
  });

  it("carry on at the plain beat width past either end", () => {
    expect(beatToX(map, -0.5)).toBeCloseTo(-40);
    expect(beatToX(map, total(beats) + 1)).toBeCloseTo(map.totalX + 80);
    expect(xToBeat(map, map.totalX + 40)).toBeCloseTo(total(beats) + 0.5);
  });
});
