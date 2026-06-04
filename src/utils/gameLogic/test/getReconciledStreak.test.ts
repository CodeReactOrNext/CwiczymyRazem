import { describe, expect, it } from "vitest";

import { getReconciledStreak } from "../getReconciledStreak";

// The activity log hands the UI a Date in local time (the real practice instant).
const localDate = (y: number, m: number, d: number): Date => new Date(y, m, d, 12, 0);
// lastReportDate is stored as UTC-midnight of the user's local day.
const storedDate = (y: number, m: number, d: number): string =>
  new Date(Date.UTC(y, m, d)).toISOString();

describe("getReconciledStreak", () => {
  const now = localDate(2026, 5, 4); // Thursday June 4

  it("falls back to the stored counter while the log has not loaded", () => {
    const result = getReconciledStreak(
      {
        actualDayWithoutBreak: 5,
        lastReportDate: storedDate(2026, 5, 4),
        reportDates: [],
      },
      now
    );

    expect(result.dayWithoutBreak).toBe(5);
    expect(result.didPracticeToday).toBe(true);
  });

  it("trusts the log over a stored counter that was corrupted too high", () => {
    // Stored counter claims 9 and its lastReportDate is pinned to today by a
    // timezone slip — but the log shows the streak actually died days ago.
    const result = getReconciledStreak(
      {
        actualDayWithoutBreak: 9,
        lastReportDate: storedDate(2026, 5, 4),
        reportDates: [localDate(2026, 5, 1), localDate(2026, 4, 30)],
      },
      now
    );

    // Log: last practice was June 1 (>1 day ago) → streak broken, no phantom.
    expect(result.dayWithoutBreak).toBe(0);
    expect(result.didPracticeToday).toBe(false);
  });

  it("does not mark today as practiced when only a corrupted counter says so", () => {
    // lastReportDate lands on today's UTC day (the old timezone bug), but the
    // log — the source of truth — has no report for today and the streak is dead.
    const result = getReconciledStreak(
      {
        actualDayWithoutBreak: 1,
        lastReportDate: storedDate(2026, 5, 4),
        reportDates: [localDate(2026, 5, 1)],
      },
      now
    );

    expect(result.didPracticeToday).toBe(false);
    expect(result.dayWithoutBreak).toBe(0);
  });

  it("heals a counter that was reset down to 1 using the log", () => {
    const result = getReconciledStreak(
      {
        actualDayWithoutBreak: 1,
        lastReportDate: storedDate(2026, 5, 4),
        reportDates: [
          localDate(2026, 5, 4),
          localDate(2026, 5, 3),
          localDate(2026, 5, 2),
          localDate(2026, 5, 1),
        ],
      },
      now
    );

    expect(result.dayWithoutBreak).toBe(4);
    expect(result.didPracticeToday).toBe(true);
  });

  it("matches the local-time log instead of a timezone-shifted 'today' (SF bug)", () => {
    // The viewer switched to San Francisco time. The stored counter's
    // lastReportDate is UTC-midnight of the reporter's local day, so it now reads
    // as "practiced today" — but in the viewer's local time the activity log
    // shows a 5-day streak that ended *yesterday*. The header must show 5, not 6.
    const result = getReconciledStreak(
      {
        actualDayWithoutBreak: 6,
        lastReportDate: storedDate(2026, 5, 4),
        reportDates: [
          localDate(2026, 5, 3),
          localDate(2026, 5, 2),
          localDate(2026, 5, 1),
          localDate(2026, 4, 31),
          localDate(2026, 4, 30),
        ],
      },
      now
    );

    expect(result.didPracticeToday).toBe(false);
    expect(result.dayWithoutBreak).toBe(5);
  });

  it("reports a broken streak when neither today nor yesterday was practiced", () => {
    const result = getReconciledStreak(
      {
        actualDayWithoutBreak: 7,
        lastReportDate: storedDate(2026, 5, 1),
        reportDates: [localDate(2026, 5, 1), localDate(2026, 4, 31)],
      },
      now
    );

    expect(result.dayWithoutBreak).toBe(0);
    expect(result.didPracticeToday).toBe(false);
  });
});
