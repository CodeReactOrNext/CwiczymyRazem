import { describe, expect, it } from "vitest";

import { addAlphaTabPassStart, alphaTabPassBeats, createAlphaTabPassClock } from "./alphaTabPassClock";

// 120 BPM, a 4-beat tab: one pass is 2 s on the grid.
const BPS = 2;
const TOTAL = 4;
const toBeats = (sec: number) => sec * BPS;
const EARLY = 0.03;
const GRACE = 1 * BPS;
const at = (clock: ReturnType<typeof createAlphaTabPassClock>, sec: number) =>
  alphaTabPassBeats(clock, sec, toBeats, TOTAL, EARLY, GRACE);

describe("alphaTabPassBeats", () => {
  it("follows the metronome anchor through the first pass", () => {
    const clock = createAlphaTabPassClock(10);
    expect(at(clock, 9.9)).toBeCloseTo(-0.2);
    expect(at(clock, 11)).toBeCloseTo(2);
  });

  it("runs past the last beat until the player restarts, instead of wrapping on the grid", () => {
    const clock = createAlphaTabPassClock(10);
    at(clock, 10);
    // The grid says pass 2 began at 12 s; the audio's tail is still playing.
    expect(at(clock, 12.05)).toBeCloseTo(4.1);
  });

  it("starts every pass from its own restart, so the slip never adds up", () => {
    const clock = createAlphaTabPassClock(10);
    at(clock, 10);
    // Each restart lands 0.1 s after the previous pass ran out.
    let start = 10;
    for (let pass = 1; pass <= 10; pass++) {
      start += 2 + 0.1;
      addAlphaTabPassStart(clock, start);
      expect(at(clock, start + 0.5)).toBeCloseTo(1);
    }
  });

  it("keeps judging the old pass until the judged audio reaches the restart", () => {
    const clock = createAlphaTabPassClock(10);
    at(clock, 10);
    // The restart is known before the judged audio (now minus input latency) gets there.
    addAlphaTabPassStart(clock, 12.1);
    expect(at(clock, 12.05)).toBeCloseTo(4.1);
    // Taken over a hair early, so the first note's early window is not cut short.
    expect(at(clock, 12.08)).toBeCloseTo(-0.04);
  });

  it("measures a resumed session within one pass, not from the very first loop", () => {
    // Resuming back-dates the metronome anchor by everything played so far.
    const clock = createAlphaTabPassClock(10);
    expect(at(clock, 15)).toBeCloseTo(2);
    // …and the next restart is still awaited at the end of that pass.
    expect(at(clock, 16.1)).toBeCloseTo(4.2);
  });

  it("falls back to looping on the grid when no restart ever comes", () => {
    const clock = createAlphaTabPassClock(10);
    at(clock, 10);
    expect(at(clock, 12.9)).toBeCloseTo(5.8);
    expect(at(clock, 13.1)).toBeCloseTo(2.2);
  });
});
