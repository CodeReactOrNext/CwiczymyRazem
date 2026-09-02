import { getTraderRestockAt } from "feature/arsenal/data/traderShop";
import { weekEnd } from "feature/communityGoal/utils/goalWeek";
import { describe, expect, it } from "vitest";

import {
  formatServerTime,
  formatTimeLeft,
  getLocalDayEnd,
  getResetSchedule,
  getServerDayEnd,
  getServerMonthEnd,
} from "./resetSchedule";

describe("getServerDayEnd", () => {
  it("lands on the next UTC midnight", () => {
    const end = getServerDayEnd(new Date("2026-09-02T13:45:00Z"));
    expect(new Date(end).toISOString()).toBe("2026-09-03T00:00:00.000Z");
  });

  it("is a full day away one millisecond after a rollover", () => {
    const end = getServerDayEnd(new Date("2026-09-02T00:00:00.001Z"));
    expect(new Date(end).toISOString()).toBe("2026-09-03T00:00:00.000Z");
  });
});

describe("getLocalDayEnd", () => {
  it("lands on the viewer's own midnight, not the server's", () => {
    const now = new Date("2026-09-02T13:45:00Z");
    const end = new Date(getLocalDayEnd(now));

    expect(end.getHours()).toBe(0);
    expect(end.getMinutes()).toBe(0);
    // Always strictly ahead of now, and never more than a day out — the only
    // two properties that hold regardless of the zone the suite runs in.
    expect(end.getTime()).toBeGreaterThan(now.getTime());
    expect(end.getTime() - now.getTime()).toBeLessThanOrEqual(86_400_000);
  });
});

describe("getServerMonthEnd", () => {
  it("lands on the first of the next month at UTC midnight", () => {
    const end = getServerMonthEnd(new Date("2026-09-20T08:00:00Z"));
    expect(new Date(end).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });

  it("rolls the year over in December", () => {
    const end = getServerMonthEnd(new Date("2026-12-31T23:59:00Z"));
    expect(new Date(end).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("getResetSchedule", () => {
  const now = new Date("2026-09-02T13:45:00Z");

  it("is sorted soonest first", () => {
    const times = getResetSchedule(now).map((entry) => entry.nextResetAt);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it("puts every reset in the future", () => {
    for (const entry of getResetSchedule(now)) {
      expect(entry.nextResetAt).toBeGreaterThan(now.getTime());
    }
  });

  it("marks the streak as the one following the viewer's own clock", () => {
    const local = getResetSchedule(now).filter(
      (entry) => entry.scope === "local",
    );

    expect(local).toHaveLength(1);
    expect(local[0].id).toBe("streak");
  });

  it("reads each boundary from the module that owns it", () => {
    const schedule = getResetSchedule(now);
    const byId = (id: string) => schedule.find((e) => e.id === id);

    // The trader restocks on the same UTC midnight the quests do, so it lands in
    // the merged daily row rather than one of its own — asserting the instant
    // here is what would catch the trader's window drifting away from the day.
    expect(byId("daily")?.nextResetAt).toBe(getTraderRestockAt(now));
    expect(byId("daily")?.label).toContain("Trader");
    expect(byId("weekly")?.nextResetAt).toBe(weekEnd(now).getTime());
  });

  it("merges rollovers that share an instant into one row", () => {
    // A Monday that starts both a new week and a new supporter cycle.
    const schedule = getResetSchedule(new Date("2026-09-14T12:00:00Z"));
    const instants = schedule.map((entry) => entry.nextResetAt);

    expect(new Set(instants).size).toBe(instants.length);
  });
});

describe("formatServerTime", () => {
  it("reads the UTC wall clock, zero-padded", () => {
    expect(formatServerTime(new Date("2026-09-02T04:07:00Z"))).toBe("04:07");
  });
});

describe("formatTimeLeft", () => {
  it("drops to days and hours past a day", () => {
    expect(formatTimeLeft(2 * 86_400_000 + 3 * 3_600_000)).toBe("2d 3h");
  });

  it("shows hours and minutes within a day", () => {
    expect(formatTimeLeft(5 * 3_600_000 + 9 * 60_000)).toBe("5h 9m");
  });

  it("shows minutes alone in the last hour", () => {
    expect(formatTimeLeft(42 * 60_000)).toBe("42m");
  });

  it("never counts below zero", () => {
    expect(formatTimeLeft(-5_000)).toBe("0m");
  });
});
