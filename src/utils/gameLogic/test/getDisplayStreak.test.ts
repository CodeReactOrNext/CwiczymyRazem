import { afterEach, describe, expect, it, vi } from "vitest";

import { getDisplayStreak } from "../getDisplayStreak";

// Builds `lastReportDate` exactly like the server does: UTC-midnight of the
// user's LOCAL calendar date. Takes a local Date and uses its local fields.
const storedReportDate = (local: Date): string => {
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00Z`;
};

describe("getDisplayStreak", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the streak when the user practiced today", () => {
    const today = new Date(2026, 5, 4, 10, 0); // June 4, 10:00 local
    const result = getDisplayStreak(
      { actualDayWithoutBreak: 5, lastReportDate: storedReportDate(today) },
      today
    );

    expect(result).toEqual({ didPracticeToday: true, dayWithoutBreak: 5 });
  });

  it("keeps the streak alive when the last report was yesterday", () => {
    const today = new Date(2026, 5, 4, 10, 0);
    const yesterday = new Date(2026, 5, 3, 10, 0);
    const result = getDisplayStreak(
      { actualDayWithoutBreak: 5, lastReportDate: storedReportDate(yesterday) },
      today
    );

    expect(result).toEqual({ didPracticeToday: false, dayWithoutBreak: 5 });
  });

  it("breaks the streak when the last report was more than a day ago", () => {
    const today = new Date(2026, 5, 4, 10, 0);
    const threeDaysAgo = new Date(2026, 5, 1, 10, 0);
    const result = getDisplayStreak(
      { actualDayWithoutBreak: 5, lastReportDate: storedReportDate(threeDaysAgo) },
      today
    );

    expect(result).toEqual({ didPracticeToday: false, dayWithoutBreak: 0 });
  });

  it("uses the LOCAL date, so late-evening practice still counts as today", () => {
    // 23:30 local on June 4. With the old code this leaked the UTC instant and
    // could land on a different calendar day; anchoring to the local date keeps
    // "today" = June 4 regardless of timezone.
    const lateEvening = new Date(2026, 5, 4, 23, 30);
    const result = getDisplayStreak(
      { actualDayWithoutBreak: 4, lastReportDate: storedReportDate(lateEvening) },
      lateEvening
    );

    expect(result).toEqual({ didPracticeToday: true, dayWithoutBreak: 4 });
  });

  it("handles month boundaries", () => {
    const today = new Date(2026, 6, 1, 10, 0); // July 1
    const yesterday = new Date(2026, 5, 30, 10, 0); // June 30
    const result = getDisplayStreak(
      { actualDayWithoutBreak: 9, lastReportDate: storedReportDate(yesterday) },
      today
    );

    expect(result.dayWithoutBreak).toBe(9);
  });

  it("defaults to the current time when no clock is provided", () => {
    const now = new Date(2026, 5, 4, 10, 0);
    vi.setSystemTime(now);

    const result = getDisplayStreak({
      actualDayWithoutBreak: 3,
      lastReportDate: storedReportDate(now),
    });

    expect(result.dayWithoutBreak).toBe(3);
  });
});
