import { describe, expect, it } from "vitest";

import { audioClockNow, createAudioClock, observeAudioClock, resetAudioClock } from "./workerAudioClock";

/** currentTime as Chromium reports it: advanced once per ~10 ms audio callback. */
const CALLBACK_SEC = 0.01;
const reportedAt = (trueSec: number) => Math.floor(trueSec / CALLBACK_SEC) * CALLBACK_SEC;

describe("workerAudioClock", () => {
  it("knows nothing before the first reading, and nothing after a reset", () => {
    const clock = createAudioClock();
    expect(audioClockNow(clock, 0)).toBeNull();
    observeAudioClock(clock, 5, 1000);
    expect(audioClockNow(clock, 1500)).toBeCloseTo(5.5, 9);
    resetAudioClock(clock);
    expect(audioClockNow(clock, 1500)).toBeNull();
  });

  it("runs smoothly through readings that are each late by a different few ms", () => {
    const clock = createAudioClock();
    // The audio clock started 3 s before the worker's wall clock read 0.
    const trueAudio = (wallMs: number) => 3 + wallMs / 1000;
    const lags: number[] = [];
    let worstFrameJump = 0;
    let prev: number | null = null;
    // 3 s of 60 fps frames, a TICK every other frame, delivered 1.3 ms after it was read.
    for (let frame = 0; frame < 180; frame++) {
      const wallMs = frame * (1000 / 60);
      if (frame % 2 === 0) observeAudioClock(clock, reportedAt(trueAudio(wallMs - 1.3)), wallMs);
      const now = audioClockNow(clock, wallMs)!;
      if (frame > 30) lags.push(trueAudio(wallMs) - now);
      if (prev !== null && frame > 30) worstFrameJump = Math.max(worstFrameJump, Math.abs(now - prev - 1 / 60));
      prev = now;
    }
    // Re-anchoring on each reading made the lag swing over a whole callback
    // (1.3–11.3 ms here); a steady lag of a few ms is harmless, a swinging one judders.
    expect(Math.max(...lags) - Math.min(...lags)).toBeLessThan(0.001);
    expect(Math.max(...lags)).toBeLessThan(0.006);
    expect(worstFrameJump).toBeLessThan(0.001);
  });

  it("follows the audio clock back when it really falls behind", () => {
    const clock = createAudioClock();
    observeAudioClock(clock, 10, 0);
    observeAudioClock(clock, 10.1, 100);
    // The context stalled for half a second.
    observeAudioClock(clock, 9.7, 200);
    expect(audioClockNow(clock, 200)).toBeCloseTo(9.7, 9);
  });

  it("moves forward at once when a reading shows it ahead", () => {
    const clock = createAudioClock();
    observeAudioClock(clock, 10, 0);
    observeAudioClock(clock, 10.03, 0);
    expect(audioClockNow(clock, 0)).toBeCloseTo(10.03, 9);
  });

  it("lets a fresh reading from long ago go once newer ones have come in", () => {
    const clock = createAudioClock();
    observeAudioClock(clock, 10.02, 0);
    observeAudioClock(clock, 12, 2000);
    // 10.02 + 2 s would be 12.02; past its second, the 12.00 reading stands alone.
    expect(audioClockNow(clock, 2000)).toBeCloseTo(12, 9);
  });
});
