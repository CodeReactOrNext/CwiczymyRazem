import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getLongestStreakFromActivityLog,
  getStreakFromActivityLog,
  getStreakWalk,
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

describe("rest days", () => {
  // November 2026 sits after REST_DAYS_SINCE. Mon Nov 2 – Sun Nov 8 is one
  // week, Mon Nov 9 – Sun Nov 15 the next.
  const nov = (d: number) => localDate(2026, 10, d);
  const days = (...list: number[]) => list.map(nov);
  const keys = (dates: Date[]) => dates.map((d) => d.getDate());

  it("carries the streak over one missed day without counting it", () => {
    const walk = getStreakWalk(days(2, 3, 5), {}, nov(5));

    expect(walk.streak).toBe(3);
    expect(keys(walk.restDayDates)).toEqual([4]);
  });

  it("keeps the streak alive the day after a rest day, before today is played", () => {
    const walk = getStreakWalk(days(2, 3), {}, nov(5));

    expect(walk.streak).toBe(2);
    expect(keys(walk.restDayDates)).toEqual([4]);
  });

  it("breaks on two missed days in a row", () => {
    expect(getStreakFromActivityLog(days(2, 3), {}, nov(6))).toBe(0);
  });

  it("breaks on a second missed day in the same week", () => {
    // Nov 3 took the week's rest day, so the Nov 5 gap ends the run.
    const walk = getStreakWalk(days(2, 4, 6), {}, nov(6));

    expect(walk.streak).toBe(1);
    expect(walk.restDayDates).toEqual([]);
  });

  it("never moves a rest day once it has been shown", () => {
    // Wednesday: Nov 3 is the rest day. A miss on Thursday must not move it
    // there, it ends the streak instead.
    expect(keys(getStreakWalk(days(2, 4), {}, nov(4)).restDayDates)).toEqual([3]);
    expect(keys(getStreakWalk(days(2, 4), {}, nov(5)).restDayDates)).toEqual([3]);
    expect(getStreakWalk(days(2, 4), {}, nov(6)).streak).toBe(0);
  });

  it("gives every week its own rest day", () => {
    const walk = getStreakWalk(days(5, 7, 8, 9, 11), {}, nov(11));

    expect(walk.streak).toBe(5);
    expect(keys(walk.restDayDates)).toEqual([10, 6]);
  });

  it("does nothing when the player switched rest days off", () => {
    const walk = getStreakWalk(days(2, 3, 5), { restDays: false }, nov(5));

    expect(walk.streak).toBe(1);
    expect(walk.restDayDates).toEqual([]);
  });

  it("treats missed days before REST_DAYS_SINCE as plain gaps", () => {
    const reports = [
      localDate(2026, 9, 22),
      // Oct 23 missed, before the rule started
      localDate(2026, 9, 24),
      localDate(2026, 9, 25),
    ];

    expect(getStreakFromActivityLog(reports, {}, localDate(2026, 9, 25))).toBe(2);
  });

  it("counts rest days into the longest run as well", () => {
    expect(getLongestStreakFromActivityLog(days(2, 3, 5, 6))).toBe(4);
    expect(
      getLongestStreakFromActivityLog(days(2, 3, 5, 6), { restDays: false })
    ).toBe(2);
  });

  it("never puts the record below the streak the player is shown", () => {
    // Nov 3 is the rest day, so the Nov 5 gap starts a new run.
    const reports = days(2, 4, 6, 7, 8);
    const current = getStreakFromActivityLog(reports, {}, nov(8));

    expect(current).toBe(3);
    expect(getLongestStreakFromActivityLog(reports)).toBeGreaterThanOrEqual(
      current
    );
  });
});
