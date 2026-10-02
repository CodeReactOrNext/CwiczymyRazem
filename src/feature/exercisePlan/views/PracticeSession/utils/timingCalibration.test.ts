import { describe, expect, it } from "vitest";

import {
  CALIBRATION_CLICKS,
  CALIBRATION_GAP_MS,
  matchAttacksToClicks,
  measureTimingLatency,
} from "./timingCalibration";

const clicks = Array.from({ length: CALIBRATION_CLICKS }, (_, i) => 10_000 + i * CALIBRATION_GAP_MS);

describe("matchAttacksToClicks", () => {
  it("measures each attack against its own click", () => {
    const attacks = clicks.map((c) => c + 120);
    expect(matchAttacksToClicks(clicks, attacks)).toEqual(clicks.map(() => 120));
  });

  it("reports a click nobody played as unheard", () => {
    const attacks = clicks.filter((_, i) => i !== 3).map((c) => c + 90);
    const delays = matchAttacksToClicks(clicks, attacks);
    expect(delays[3]).toBeNull();
    expect(delays.filter((d) => d === 90)).toHaveLength(CALIBRATION_CLICKS - 1);
  });

  it("takes the pick, not the string settling after it", () => {
    const attacks = clicks.flatMap((c) => [c + 100, c + 160]);
    expect(matchAttacksToClicks(clicks, attacks)).toEqual(clicks.map(() => 100));
  });

  it("still pairs a slow Bluetooth chain with the right click", () => {
    const attacks = clicks.map((c) => c + 260);
    expect(matchAttacksToClicks(clicks, attacks)).toEqual(clicks.map(() => 260));
  });

  it("accepts a player slightly ahead of the click", () => {
    const attacks = clicks.map((c) => c - 30);
    expect(matchAttacksToClicks(clicks, attacks)).toEqual(clicks.map(() => -30));
  });

  it("ignores an attack too far from any click", () => {
    // Halfway between clicks — neither click's answer.
    const attacks = [clicks[0] - CALIBRATION_GAP_MS / 2];
    expect(matchAttacksToClicks(clicks, attacks).every((d) => d === null)).toBe(true);
  });
});

describe("measureTimingLatency", () => {
  it("takes the median delay as the latency", () => {
    const delays = [110, 120, 130, 115, 125, 118, 122, 400, 119, 120, 117, 123];
    const result = measureTimingLatency(delays);
    expect(result).toMatchObject({ ok: true, latencyMs: 120, hits: 12, total: 12 });
  });

  it("reports how tightly the hits sat around it", () => {
    const delays = [100, 110, 90, 105, 95, 100, 110, 90, 105, 95, 100, 100];
    const result = measureTimingLatency(delays);
    expect(result.ok && result.spreadMs).toBe(5);
  });

  it("refuses to guess from too few heard clicks", () => {
    const delays = [100, 100, 100, null, null, null, null, null, 100, 100, 100, 100];
    expect(measureTimingLatency(delays)).toMatchObject({ ok: false, reason: "tooFewHits", hits: 7 });
  });

  it("refuses a run that didn't follow the click", () => {
    const delays = [0, 200, 40, 180, 10, 220, 60, 150, 0, 210, 30, 190];
    expect(measureTimingLatency(delays)).toMatchObject({ ok: false, reason: "inconsistent" });
  });

  it("refuses attacks that land well ahead of the click", () => {
    // What a string muted between clicks looks like: its decay fires early.
    const delays = Array.from({ length: 12 }, () => -90);
    expect(measureTimingLatency(delays)).toMatchObject({ ok: false, reason: "ahead" });
  });

  it("never stores a negative latency for a player a hair ahead of every click", () => {
    const delays = Array.from({ length: 12 }, () => -20);
    expect(measureTimingLatency(delays)).toMatchObject({ ok: true, latencyMs: 0 });
  });
});
