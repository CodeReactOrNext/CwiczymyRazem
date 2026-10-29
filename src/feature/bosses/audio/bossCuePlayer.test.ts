import type { SessionAudioClock } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { afterEach, describe, expect, it } from "vitest";

import { bossCuePlayer } from "./bossCuePlayer";

/** A session clock at `now` seconds: a run started at 0, 120 BPM — an eighth every 0.25 s. */
const clockAt = (now: number) =>
  ({
    context: { currentTime: now, state: "running" },
    startTime: 0,
    bpm: 120,
    volume: 1,
  }) as unknown as SessionAudioClock;

afterEach(() => bossCuePlayer.setClock(null));

describe("bossCuePlayer's strikes", () => {
  it("lands a strike on the next eighth and keeps that time while it is waited on", () => {
    const clock = clockAt(10.1);
    bossCuePlayer.setClock(clock);
    expect(bossCuePlayer.strikeDelayMs(1)).toBeCloseTo(150, 0);
    (clock.context as { currentTime: number }).currentTime = 10.2;
    expect(bossCuePlayer.strikeDelayMs(1)).toBeCloseTo(50, 0);
  });

  it("times a new run's strikes afresh, though its ticks count from 0 again", () => {
    const clock = clockAt(10.1);
    bossCuePlayer.setClock(clock);
    for (const tick of [1, 2, 3]) bossCuePlayer.strikeDelayMs(tick);
    // A new run, later on the same clock: its first strike is tick 1 again.
    (clock.context as { currentTime: number }).currentTime = 20.1;
    expect(bossCuePlayer.strikeDelayMs(1)).toBeCloseTo(150, 0);
    // Its third too, though the last run's newest tick was that one.
    (clock.context as { currentTime: number }).currentTime = 30.1;
    expect(bossCuePlayer.strikeDelayMs(3)).toBeCloseTo(150, 0);
  });

  it("forgets the strikes of a session that ended", () => {
    bossCuePlayer.setClock(clockAt(10.1));
    bossCuePlayer.strikeDelayMs(5);
    bossCuePlayer.setClock(null);
    bossCuePlayer.setClock(clockAt(30.1));
    expect(bossCuePlayer.strikeDelayMs(5)).toBeCloseTo(150, 0);
  });
});
