import { describe, expect, it } from "vitest";

import {
  CYCLE_WEEKS,
  cycleEnd,
  cycleIdOf,
  cycleStart,
  daysLeftInCycle,
  nextCycleId,
} from "./caseCycle";

describe("cycleStart", () => {
  it("always lands on a Monday", () => {
    const dates = [
      "2026-08-24T00:00:00.000Z",
      "2026-08-28T15:00:00.000Z",
      "2026-09-06T23:59:00.000Z",
      "2026-12-31T12:00:00.000Z",
    ];

    for (const date of dates) {
      expect(cycleStart(new Date(date)).getUTCDay()).toBe(1);
    }
  });

  it("holds the same start across the whole fortnight", () => {
    const start = cycleStart(new Date("2026-08-24T00:00:00.000Z"));

    // Every day of both weeks resolves to the same cycle.
    for (let day = 0; day < CYCLE_WEEKS * 7; day++) {
      const inside = new Date(start.getTime() + day * 86_400_000 + 3_600_000);
      expect(cycleStart(inside).toISOString()).toBe(start.toISOString());
    }
  });

  it("moves on exactly one fortnight later", () => {
    const start = cycleStart(new Date("2026-08-24T00:00:00.000Z"));
    const after = cycleStart(
      new Date(start.getTime() + CYCLE_WEEKS * 7 * 86_400_000),
    );

    expect(after.getTime() - start.getTime()).toBe(
      CYCLE_WEEKS * 7 * 86_400_000,
    );
  });

  it("keeps its phase before the anchor date", () => {
    // Dates earlier than the anchor must not fall a week out of step.
    const early = cycleStart(new Date("2025-03-12T00:00:00.000Z"));
    const later = cycleStart(new Date("2027-03-12T00:00:00.000Z"));
    const weeksApart = (later.getTime() - early.getTime()) / (7 * 86_400_000);

    expect(weeksApart % CYCLE_WEEKS).toBe(0);
  });
});

describe("the cycle runs no shorter than the floor", () => {
  it("is at least a week and a half", () => {
    const start = cycleStart(new Date("2026-08-24T00:00:00.000Z"));
    const lengthDays =
      (cycleEnd(start).getTime() - start.getTime()) / 86_400_000;

    expect(lengthDays).toBeGreaterThanOrEqual(10.5);
    expect(lengthDays).toBe(14);
  });
});

describe("cycleIdOf", () => {
  it("names the cycle by the day it started", () => {
    expect(cycleIdOf(new Date("2026-08-28T15:00:00.000Z"))).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
    expect(cycleIdOf(new Date("2026-08-28T15:00:00.000Z"))).toBe(
      cycleStart(new Date("2026-08-28T15:00:00.000Z"))
        .toISOString()
        .slice(0, 10),
    );
  });

  it("sorts in the order the cycles happen", () => {
    const ids = ["2026-01-20", "2026-05-05", "2026-08-28", "2026-11-11"].map(
      (day) => cycleIdOf(new Date(`${day}T00:00:00.000Z`)),
    );

    expect([...ids].sort()).toEqual(ids);
  });

  it("gives the next cycle a different id", () => {
    const now = new Date("2026-08-28T15:00:00.000Z");
    expect(nextCycleId(now)).not.toBe(cycleIdOf(now));
    expect(nextCycleId(now) > cycleIdOf(now)).toBe(true);
  });
});

describe("daysLeftInCycle", () => {
  it("counts down and never goes negative", () => {
    const start = cycleStart(new Date("2026-08-24T00:00:00.000Z"));

    expect(daysLeftInCycle(new Date(start.getTime() + 3_600_000))).toBe(14);
    expect(daysLeftInCycle(new Date(start.getTime() + 13 * 86_400_000))).toBe(
      1,
    );
    // The last millisecond still belongs to the cycle that is ending.
    expect(daysLeftInCycle(new Date(cycleEnd(start).getTime() - 1))).toBe(1);
  });

  it("hands straight over to the next cycle at the boundary", () => {
    const start = cycleStart(new Date("2026-08-24T00:00:00.000Z"));
    const handover = cycleEnd(start);

    // The end instant is the *next* cycle's first, so the counter resets rather
    // than sitting at zero — there is never a gap with no slate running.
    expect(cycleStart(handover).toISOString()).toBe(handover.toISOString());
    expect(daysLeftInCycle(handover)).toBe(14);
  });
});
