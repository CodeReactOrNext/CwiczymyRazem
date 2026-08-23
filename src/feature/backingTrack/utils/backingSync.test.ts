import { createTempoRulerFromMeasures } from "feature/exercisePlan/views/PracticeSession/hooks/tempoBeatClock";
import { describe, expect, it } from "vitest";

import {
  achievableSessionBpms,
  beatsSinceStart,
  canYouTubeFollow,
  clampPlaybackRate,
  HARD_SEEK_THRESHOLD_SEC,
  isCleanStretch,
  MAX_NUDGE,
  NUDGE_DEADBAND_SEC,
  playbackRateFor,
  resolveDrift,
  resolveYouTubeRate,
  STARTUP_SEEK_THRESHOLD_SEC,
  syncRateFor,
  trackTimeForBeat,
} from "./backingSync";

describe("beatsSinceStart", () => {
  it("counts quarter notes from the metronome's back-dated start", () => {
    expect(beatsSinceStart(10_000, 8_000, 120)).toBeCloseTo(4);
  });

  it("returns 0 before the session has started", () => {
    expect(beatsSinceStart(10_000, null, 120)).toBe(0);
  });

  it("never goes negative when the clock is back-dated into the future (count-in)", () => {
    expect(beatsSinceStart(9_000, 10_000, 120)).toBe(0);
  });

  it("scales with tempo — half the BPM, half the beats", () => {
    expect(beatsSinceStart(10_000, 8_000, 60)).toBeCloseTo(2);
  });
});

describe("trackTimeForBeat", () => {
  it("maps beats onto the recording's own timeline via its source tempo", () => {
    expect(trackTimeForBeat(4, 120, 0)).toBeCloseTo(2);
  });

  it("ignores the session tempo entirely — only sourceBpm moves the position", () => {
    expect(trackTimeForBeat(8, 60, 0)).toBeCloseTo(8);
  });

  it("shifts by the offset so beat 0 can land inside an intro", () => {
    expect(trackTimeForBeat(0, 120, 5_000)).toBeCloseTo(5);
    expect(trackTimeForBeat(4, 120, 5_000)).toBeCloseTo(7);
  });

  it("returns a negative time when the file should start after the tab", () => {
    expect(trackTimeForBeat(0, 120, -2_000)).toBeCloseTo(-2);
  });
});

describe("playbackRateFor", () => {
  it("is exactly 1 when the session runs at the recording's own tempo", () => {
    expect(playbackRateFor(120, 120)).toBe(1);
  });

  it("speeds the file up proportionally to the session tempo", () => {
    expect(playbackRateFor(150, 120)).toBeCloseTo(1.25);
  });

  it("clamps absurd ratios instead of handing the element an unusable rate", () => {
    expect(playbackRateFor(1000, 20)).toBe(4);
    expect(playbackRateFor(10, 400)).toBe(0.25);
  });

  it("falls back to 1 for a nonsense source tempo", () => {
    expect(playbackRateFor(120, 0)).toBe(1);
  });
});

describe("clampPlaybackRate / isCleanStretch", () => {
  it("keeps a sane rate untouched", () => {
    expect(clampPlaybackRate(0.9)).toBe(0.9);
  });

  it("treats NaN as normal speed", () => {
    expect(clampPlaybackRate(NaN)).toBe(1);
  });

  it("flags stretching beyond half/double speed as no longer clean", () => {
    expect(isCleanStretch(1)).toBe(true);
    expect(isCleanStretch(0.5)).toBe(true);
    expect(isCleanStretch(0.49)).toBe(false);
    expect(isCleanStretch(2.5)).toBe(false);
  });
});

describe("resolveDrift", () => {
  it("does nothing while drift is inside the deadband", () => {
    expect(resolveDrift(NUDGE_DEADBAND_SEC / 2)).toEqual({ action: "none", rateFactor: 1 });
  });

  it("seeks once drift is past the hard threshold", () => {
    expect(resolveDrift(HARD_SEEK_THRESHOLD_SEC + 0.01).action).toBe("seek");
    expect(resolveDrift(-(HARD_SEEK_THRESHOLD_SEC + 0.01)).action).toBe("seek");
  });

  it("slows the track down when it runs ahead", () => {
    const { action, rateFactor } = resolveDrift(0.05);
    expect(action).toBe("nudge");
    expect(rateFactor).toBeLessThan(1);
  });

  it("speeds the track up when it lags behind", () => {
    const { action, rateFactor } = resolveDrift(-0.05);
    expect(action).toBe("nudge");
    expect(rateFactor).toBeGreaterThan(1);
  });

  it("never distorts tempo by more than the nudge cap", () => {
    expect(resolveDrift(0.24).rateFactor).toBeGreaterThanOrEqual(1 - MAX_NUDGE);
    expect(resolveDrift(-0.24).rateFactor).toBeLessThanOrEqual(1 + MAX_NUDGE);
  });

  it("treats a NaN reading as no correction rather than seeking blindly", () => {
    expect(resolveDrift(NaN)).toEqual({ action: "none", rateFactor: 1 });
  });
});

describe("resolveYouTubeRate", () => {
  it("keeps a rate the player already supports", () => {
    expect(resolveYouTubeRate(1.25)).toBe(1.25);
  });

  it("rounds towards 1, not to the nearest — 1.17 becomes 1, never 1.25", () => {
    expect(resolveYouTubeRate(1.1667)).toBe(1);
  });

  it("rounds up towards 1 from below", () => {
    expect(resolveYouTubeRate(0.93)).toBe(1);
    expect(resolveYouTubeRate(0.6)).toBe(0.75);
  });

  it("clamps to the player's own range when asked for the impossible", () => {
    expect(resolveYouTubeRate(9)).toBe(2);
    expect(resolveYouTubeRate(0.05)).toBe(0.25);
  });

  it("uses the rates the live player reported, not the fallback list", () => {
    expect(resolveYouTubeRate(1.4, [0.5, 1, 2])).toBe(1);
    expect(resolveYouTubeRate(1.4, [1, 1.4, 2])).toBe(1.4);
  });

  it("falls back to normal speed for nonsense input", () => {
    expect(resolveYouTubeRate(NaN)).toBe(1);
    expect(resolveYouTubeRate(1.5, [])).toBe(1);
  });
});

describe("canYouTubeFollow", () => {
  it("confirms a lock only when the video plays the exact rate asked for", () => {
    expect(canYouTubeFollow(1)).toBe(true);
    expect(canYouTubeFollow(1.5)).toBe(true);
  });

  it("reports the tempos where the video would slide against the tab", () => {
    expect(canYouTubeFollow(0.93)).toBe(false);
    expect(canYouTubeFollow(1.1667)).toBe(false);
  });
});

describe("achievableSessionBpms", () => {
  it("lists the tempos at which tab and video stay locked", () => {
    expect(achievableSessionBpms(120)).toEqual([30, 60, 90, 120, 150, 180, 210, 240]);
  });

  it("follows the rates the live player actually offers", () => {
    expect(achievableSessionBpms(100, [0.5, 1, 2])).toEqual([50, 100, 200]);
  });

  it("collapses rates that round to the same tempo", () => {
    expect(achievableSessionBpms(4, [0.25, 0.3, 1])).toEqual([1, 4]);
  });

  it("has nothing to offer without a recording tempo", () => {
    expect(achievableSessionBpms(0)).toEqual([]);
  });
});

describe("resolveDrift startup threshold", () => {
  it("seeks on a small error when the tighter startup threshold is passed", () => {
    expect(resolveDrift(0.06, STARTUP_SEEK_THRESHOLD_SEC).action).toBe("seek");
  });

  it("only nudges at that same error once running on the default threshold", () => {
    expect(resolveDrift(0.06).action).toBe("nudge");
  });

  it("still leaves a genuinely tiny error alone", () => {
    expect(resolveDrift(0.005, STARTUP_SEEK_THRESHOLD_SEC).action).toBe("none");
  });
});

describe("beatsSinceStart with a score clock", () => {
  const start = 1_000_000;

  /**
   * The session's own ruler, built from a score whose bars 3–4 run at 0.8×.
   * Imported rather than faked: the whole point of the clock is that the backing
   * track and the metronome agree about which bar is playing, and a stub would
   * assert that against itself.
   */
  const bar = (tempoChange?: number) => ({
    beats: [1, 1, 1, 1].map(() => ({ notes: [], duration: 1 })),
    timeSignature: [4, 4] as [number, number],
    ...(tempoChange !== undefined ? { tempoChange } : {}),
  });
  const ruler = createTempoRulerFromMeasures([bar(), bar(), bar(0.8), bar(0.8), bar(1), bar(1)]);

  it("ticks evenly when the score carries no automation", () => {
    expect(beatsSinceStart(start + 1000, start, 120)).toBeCloseTo(2);
    expect(beatsSinceStart(start + 1000, start, 120, null)).toBeCloseTo(2);
  });

  it("holds the tab back through a section the score slows down for", () => {
    // Bar 3 starts at score beat 8, which the session reaches at 4s flat.
    expect(beatsSinceStart(start + 4000, start, 120, ruler)).toBeCloseTo(8);
    // Two bars later the wall clock is 2.5s further on, not 2s.
    expect(beatsSinceStart(start + 6500, start, 120, ruler)).toBeCloseTo(12);
  });

  it("reads the same beat the session is actually playing, at any tempo", () => {
    // The regression this exists for: elapsed × bpm / 60 is a *warped* beat, and
    // reading it as a score beat put the grid a whole bar out by the end of a
    // song — an error no amount of dragging the offset could take back.
    for (const bpm of [60, 120, 180]) {
      for (const scoreBeat of [0, 4, 8, 12, 16, 24]) {
        const wallMs = start + ruler.toWarped(scoreBeat) * (60_000 / bpm);
        expect(beatsSinceStart(wallMs, start, bpm, ruler)).toBeCloseTo(scoreBeat, 6);
      }
    }
  });

  it("never reports negative beats before the session starts", () => {
    expect(beatsSinceStart(start - 500, start, 120, ruler)).toBe(0);
  });

  it("has nothing to report before the clock is running", () => {
    expect(beatsSinceStart(start, null, 120, ruler)).toBe(0);
  });
});

describe("syncRateFor", () => {
  it("is the plain tempo ratio when neither curve bends", () => {
    expect(syncRateFor({ effectiveBpm: 120, scoreRatio: 1, recordingBpm: 120 })).toBe(1);
    expect(syncRateFor({ effectiveBpm: 150, scoreRatio: 1, recordingBpm: 120 })).toBeCloseTo(1.25);
  });

  it("slows the recording down where the tab slows down", () => {
    // Without this the target creeps away 20% a second and the corrector answers
    // with a hard seek roughly once a second — audible, and never catching up.
    expect(syncRateFor({ effectiveBpm: 120, scoreRatio: 0.8, recordingBpm: 120 })).toBeCloseTo(0.8);
  });

  it("leaves the recording untouched once the tab was bent to follow it", () => {
    // A bar pinned at 96 BPM against a 120 BPM recording makes the tab run at
    // 0.8× there, and the two cancel — which is what "the performance is never
    // warped" actually means in arithmetic.
    expect(syncRateFor({ effectiveBpm: 120, scoreRatio: 0.8, recordingBpm: 96 })).toBeCloseTo(1);
  });

  it("treats a nonsense ratio as no bend rather than poisoning the rate", () => {
    expect(syncRateFor({ effectiveBpm: 120, scoreRatio: 0, recordingBpm: 120 })).toBe(1);
    expect(syncRateFor({ effectiveBpm: 120, scoreRatio: Number.NaN, recordingBpm: 120 })).toBe(1);
  });
});
