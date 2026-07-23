import { describe, expect, it } from "vitest";

import {
  DAILY_POOL_SIZE,
  DAILY_POOL_SLOTS,
  getDailyPool,
  getDailyPoolSeed,
  getNextDailyReset,
} from "./dailyCase";

const poolKeys = (date: Date) =>
  getDailyPool(date).map((e) => `${e.kind}-${e.def.id}`);

// The 3-day UTC window containing 2026-07-23 spans Jul 21–23;
// the next one starts at 2026-07-24T00:00Z.
describe("getDailyPoolSeed", () => {
  it("gives the same seed for every moment of one rotation window", () => {
    expect(getDailyPoolSeed(new Date("2026-07-21T00:00:00Z"))).toBe(
      getDailyPoolSeed(new Date("2026-07-23T23:59:59Z"))
    );
  });

  it("changes when the window rolls over", () => {
    expect(getDailyPoolSeed(new Date("2026-07-23T23:59:59Z"))).not.toBe(
      getDailyPoolSeed(new Date("2026-07-24T00:00:00Z"))
    );
  });
});

describe("getDailyPool", () => {
  it("is deterministic — the same window always yields the identical pool", () => {
    expect(poolKeys(new Date("2026-07-21T02:00:00Z"))).toEqual(
      poolKeys(new Date("2026-07-23T21:00:00Z"))
    );
  });

  it("rotates between windows", () => {
    expect(poolKeys(new Date("2026-07-23T12:00:00Z"))).not.toEqual(
      poolKeys(new Date("2026-07-24T12:00:00Z"))
    );
  });

  it("always fills every rarity slot", () => {
    const pool = getDailyPool(new Date("2026-07-23T12:00:00Z"));
    expect(pool).toHaveLength(DAILY_POOL_SIZE);
    for (const [rarity, slots] of Object.entries(DAILY_POOL_SLOTS)) {
      expect(pool.filter((e) => e.def.rarity === rarity)).toHaveLength(slots);
    }
  });

  it("never repeats an item within the pool", () => {
    const keys = poolKeys(new Date("2026-07-23T12:00:00Z"));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("getNextDailyReset", () => {
  it("returns the start of the next rotation window", () => {
    expect(getNextDailyReset(new Date("2026-07-23T15:30:00Z")).toISOString()).toBe(
      "2026-07-24T00:00:00.000Z"
    );
    expect(getNextDailyReset(new Date("2026-07-21T00:00:01Z")).toISOString()).toBe(
      "2026-07-24T00:00:00.000Z"
    );
  });

  it("gives a full window from a boundary moment", () => {
    expect(getNextDailyReset(new Date("2026-07-24T00:00:00Z")).toISOString()).toBe(
      "2026-07-27T00:00:00.000Z"
    );
  });
});
