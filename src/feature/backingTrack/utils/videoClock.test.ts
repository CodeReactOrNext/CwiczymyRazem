import { describe, expect, it } from "vitest";

import { createVideoClock } from "./videoClock";

const playing = (currentTime: number, rate = 1) => ({
  currentTime,
  durationSec: 240,
  rate,
  isPlaying: true,
});

/** Feeds a run of readings at a fixed interval, as the poll loop does. */
function play(
  clock: ReturnType<typeof createVideoClock>,
  options: {
    fromMs?: number;
    count: number;
    stepMs?: number;
    rate?: number;
    startSec?: number;
    /** What the player says, given where it truly is. Defaults to the truth. */
    report?: (trueSec: number) => number;
  },
) {
  const { fromMs = 0, count, stepMs = 200, rate = 1, startSec = 0, report } = options;
  for (let i = 0; i < count; i += 1) {
    const atMs = fromMs + i * stepMs;
    const trueSec = startSec + (rate * (atMs - fromMs)) / 1000;
    clock.sample(playing(report ? report(trueSec) : trueSec, rate), atMs);
  }
  return fromMs + (count - 1) * stepMs;
}

describe("createVideoClock", () => {
  it("has nothing to say before it has been fed", () => {
    expect(createVideoClock().at(0)).toBeNull();
  });

  it("answers from a single reading before there is a line to fit", () => {
    const clock = createVideoClock();
    clock.sample(playing(10), 1_000);

    expect(clock.at(1_500)).toBeCloseTo(10.5, 3);
  });

  it("follows the position between readings", () => {
    const clock = createVideoClock();
    const last = play(clock, { count: 20 });

    expect(clock.at(last + 100)).toBeCloseTo(3.9, 2);
  });

  it("does not inherit the lag of a player that answers in steps", () => {
    // The failure this exists for: a reported position that only refreshes four
    // times a second is stale by up to 250 ms, always in the same direction. A
    // line through the middle of those readings is a quarter-second lag baked
    // into every bucket of the waveform.
    const clock = createVideoClock();
    const last = play(clock, {
      count: 40,
      stepMs: 100,
      report: (trueSec) => Math.floor(trueSec * 4) / 4,
    });

    const truth = (last - 0) / 1000;
    expect(clock.at(last)).toBeGreaterThan(truth - 0.06);
    expect(clock.at(last)).toBeLessThanOrEqual(truth + 0.02);
  });

  it("measures the rate the video is really running at", () => {
    const clock = createVideoClock();
    // Told 1.5×, actually running a touch under it — which is the normal case.
    play(clock, { count: 30, rate: 1.47 });

    expect(clock.observedRate()).toBeCloseTo(1.47, 2);
  });

  it("says nothing while the video is paused", () => {
    const clock = createVideoClock();
    play(clock, { count: 20 });

    clock.sample({ currentTime: 3.8, durationSec: 240, rate: 1, isPlaying: false }, 4_000);

    expect(clock.at(4_000)).toBeNull();
  });

  it("says nothing once the player has gone quiet", () => {
    const clock = createVideoClock();
    const last = play(clock, { count: 20 });

    // Extrapolating across a gap this long would invent positions, and audio
    // filed under an invented position is worse than a gap in the waveform.
    expect(clock.at(last + 5_000)).toBeNull();
  });

  it("drops the run when the video is seeked", () => {
    const clock = createVideoClock();
    const last = play(clock, { count: 20 });
    const before = clock.epoch();

    clock.sample(playing(120), last + 200);

    expect(clock.epoch()).toBe(before + 1);
    expect(clock.at(last + 200)).toBeCloseTo(120, 2);
  });

  it("refuses to place audio that was captured before a seek", () => {
    // Sound already in flight when the video jumped belongs to where it was,
    // not to where it landed — filing it under the new position would write
    // one part of the song over another.
    const clock = createVideoClock();
    const last = play(clock, { count: 20 });
    clock.sample(playing(120), last + 200);

    expect(clock.at(last)).toBeNull();
  });

  it("starts over when the rate changes under it", () => {
    const clock = createVideoClock();
    const last = play(clock, { count: 20 });
    const before = clock.epoch();

    clock.sample(playing(4.0, 1.5), last + 200);

    expect(clock.epoch()).toBe(before + 1);
    expect(clock.observedRate()).toBe(1.5);
  });

  it("remembers the longest length the player ever admitted to", () => {
    const clock = createVideoClock();
    clock.sample({ currentTime: 0, durationSec: 12, rate: 1, isPlaying: true }, 0);
    clock.sample({ currentTime: 1, durationSec: 240, rate: 1, isPlaying: true }, 1_000);
    clock.sample({ currentTime: 2, durationSec: 0, rate: 1, isPlaying: true }, 2_000);

    expect(clock.durationSec()).toBe(240);
  });
});
