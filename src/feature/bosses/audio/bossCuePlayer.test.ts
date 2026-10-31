import { useAutoBackingStore } from "feature/autoBacking/store/autoBackingStore";
import { activeBand, clearActiveBand, setActiveBand } from "feature/autoBacking/synth/activeBand";
import type { AmbientBand } from "feature/autoBacking/synth/ambientBand";
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

/** A band that only keeps the energy it is told, the way AmbientBand does. */
const fakeBand = (context: SessionAudioClock["context"]) => {
  let steps: { at: number; level: number }[] = [];
  return {
    context,
    setEnergy(level: number, at: number) {
      steps = [...steps.filter((step) => step.at < at), { at, level }];
    },
    energyAt(time: number) {
      let level: number | null = null;
      for (const step of steps) if (step.at <= time) level = step.level;
      return level;
    },
    accent() {},
    setDanger() {},
    setTension() {},
    resetLive() {},
  };
};

describe("bossCuePlayer's battle score", () => {
  const withBand = (now: number) => {
    const clock = clockAt(now);
    const band = fakeBand(clock.context);
    setActiveBand(band as unknown as AmbientBand);
    useAutoBackingStore.setState({ enabled: true, available: true });
    bossCuePlayer.setClock(clock);
    bossCuePlayer.play({ kind: "energy", level: 1, drop: true, glide: true });
    return { clock, band };
  };
  const at = (clock: SessionAudioClock, now: number) => {
    (clock.context as { currentTime: number }).currentTime = now;
  };

  afterEach(() => clearActiveBand(activeBand()!));

  it("builds a layer a bar, from the next bar line on", () => {
    // 120 BPM: a bar every 2 s, the next one at 12 s.
    const { band } = withBand(10.1);
    bossCuePlayer.play({ kind: "energy", level: 4, drop: false, everyBeats: 4, glide: true });
    expect([11.9, 12, 14, 16].map((t) => band.energyAt(t))).toEqual([1, 2, 3, 4]);
  });

  it("winds down a layer a bar after a miss", () => {
    const { clock, band } = withBand(10.1);
    bossCuePlayer.play({ kind: "energy", level: 4, drop: false, everyBeats: 4, glide: true });
    at(clock, 16.5);
    bossCuePlayer.play({ kind: "energy", level: 1, drop: true, everyBeats: 4, glide: true });
    expect([17.9, 18, 20, 22].map((t) => band.energyAt(t))).toEqual([4, 3, 2, 1]);
  });

  it("lifts the band a layer on a strike, not to the double kick", () => {
    const { band } = withBand(10.1);
    const strike = 10.1 + bossCuePlayer.strikeDelayMs(1) / 1000;
    bossCuePlayer.play({ kind: "now", cue: "strike", tick: 1 });
    expect(band.energyAt(strike + 0.01)).toBe(2);
    // Back to the run's own energy on a bar line.
    expect(band.energyAt(14)).toBe(1);
  });
});
