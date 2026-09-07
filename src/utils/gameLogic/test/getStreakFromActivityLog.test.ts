import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getLongestStreakFromActivityLog,
  getStreakFromActivityLog,
} from "../getStreakFromActivityLog";

// Server stores the log date as UTC-midnight of the user's local day; the
// activity log then reads it back and renders it in local time. Build dates the
// same way the UI receives them (a Date in local time).
const localDate = (y: number, m: number, d: number): Date => new Date(y, m, d, 12, 0);

describe("getStreakFromActivityLog", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts consecutive days ending today", () => {
    const now = localDate(2026, 5, 4); // June 4
    const reports = [
      localDate(2026, 5, 4),
      localDate(2026, 5, 3),
      localDate(2026, 5, 2),
      localDate(2026, 5, 1),
      localDate(2026, 4, 31),
    ];

    expect(getStreakFromActivityLog(reports, {}, now)).toBe(5);
  });

  it("keeps the streak alive when the last practice was yesterday", () => {
    const now = localDate(2026, 5, 4);
    const reports = [
      localDate(2026, 5, 3),
      localDate(2026, 5, 2),
      localDate(2026, 5, 1),
    ];

    expect(getStreakFromActivityLog(reports, {}, now)).toBe(3);
  });

  it("returns 0 when the last practice was more than a day ago", () => {
    const now = localDate(2026, 5, 4);
    const reports = [localDate(2026, 5, 1), localDate(2026, 4, 31)];

    expect(getStreakFromActivityLog(reports, {}, now)).toBe(0);
  });

  it("stops counting at the first gap", () => {
    const now = localDate(2026, 5, 4);
    const reports = [
      localDate(2026, 5, 4),
      localDate(2026, 5, 3),
      // gap on June 2
      localDate(2026, 5, 1),
      localDate(2026, 5, 0),
    ];

    expect(getStreakFromActivityLog(reports, {}, now)).toBe(2);
  });

  it("de-duplicates multiple reports on the same day", () => {
    const now = localDate(2026, 5, 4);
    const reports = [
      localDate(2026, 5, 4),
      localDate(2026, 5, 4),
      localDate(2026, 5, 3),
    ];

    expect(getStreakFromActivityLog(reports, {}, now)).toBe(2);
  });

  it("counts today via includeToday when the fresh report has not been refetched", () => {
    const now = localDate(2026, 5, 4);
    // Log only has yesterday + before; today's report is still propagating.
    const reports = [localDate(2026, 5, 3), localDate(2026, 5, 2)];

    expect(getStreakFromActivityLog(reports, { includeToday: true }, now)).toBe(3);
  });

  it("crosses month boundaries", () => {
    const now = localDate(2026, 6, 1); // July 1
    const reports = [
      localDate(2026, 6, 1),
      localDate(2026, 5, 30),
      localDate(2026, 5, 29),
    ];

    expect(getStreakFromActivityLog(reports, {}, now)).toBe(3);
  });

  it("ignores invalid / empty entries", () => {
    const now = localDate(2026, 5, 4);
    const reports = [
      localDate(2026, 5, 4),
      null,
      undefined,
      "not-a-date",
      localDate(2026, 5, 3),
    ];

    expect(getStreakFromActivityLog(reports, {}, now)).toBe(2);
  });

  it("accepts ISO date strings", () => {
    const now = localDate(2026, 5, 4);
    const reports = ["2026-06-04T00:00:00.000Z", "2026-06-03T00:00:00.000Z"];

    // Parsed in local time; for any positive UTC offset these land on June 4/3.
    const result = getStreakFromActivityLog(reports, {}, now);
    expect(result).toBeGreaterThanOrEqual(1);
  });
});

describe("getLongestStreakFromActivityLog", () => {
  it("finds the longest run, not the most recent one", () => {
    const reports = [
      // A 4-day run in May...
      localDate(2026, 4, 10),
      localDate(2026, 4, 11),
      localDate(2026, 4, 12),
      localDate(2026, 4, 13),
      // ...and a 2-day one in June.
      localDate(2026, 5, 1),
      localDate(2026, 5, 2),
    ];

    expect(getLongestStreakFromActivityLog(reports)).toBe(4);
  });

  it("does not care what order the log arrives in", () => {
    const reports = [
      localDate(2026, 5, 3),
      localDate(2026, 5, 1),
      localDate(2026, 5, 2),
    ];

    expect(getLongestStreakFromActivityLog(reports)).toBe(3);
  });

  it("counts several reports on one day once", () => {
    const reports = [
      localDate(2026, 5, 1),
      new Date(2026, 5, 1, 22, 30),
      localDate(2026, 5, 2),
    ];

    expect(getLongestStreakFromActivityLog(reports)).toBe(2);
  });

  it("crosses month and year boundaries", () => {
    const reports = [
      localDate(2025, 11, 30),
      localDate(2025, 11, 31),
      localDate(2026, 0, 1),
      localDate(2026, 0, 2),
    ];

    expect(getLongestStreakFromActivityLog(reports)).toBe(4);
  });

  it("ignores invalid / empty entries", () => {
    const reports = [
      localDate(2026, 5, 1),
      null,
      undefined,
      "not-a-date",
      localDate(2026, 5, 2),
    ];

    expect(getLongestStreakFromActivityLog(reports)).toBe(2);
  });

  it("returns 0 for an empty log", () => {
    expect(getLongestStreakFromActivityLog([])).toBe(0);
  });

  it("heals a record the stored counter lost to a timezone slip", () => {
    // A 120-day run: the counter that was reset to 1 partway through cannot
    // show this any more, the log still can.
    const reports = Array.from({ length: 120 }, (_, index) =>
      localDate(2026, 1, 1 + index)
    );

    expect(getLongestStreakFromActivityLog(reports)).toBe(120);
  });
});
