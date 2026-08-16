import { describe, expect, it } from "vitest";

import { evaluateStreakReminder } from "./streakCandidate";

// 17:00 UTC = 19:00 in Warsaw, the hour the reminder aims for.
const NOW = new Date("2026-08-16T17:00:00Z");

describe("evaluateStreakReminder", () => {
  it("quotes the app's streak, not the drifted counter", () => {
    // The exact shape behind the reported bug: the stored counter was reset by a
    // timezone slip while the activity log (and every screen in the app) still
    // shows 79.
    const target = evaluateStreakReminder(
      {
        streakDays: 79,
        actualDayWithoutBreak: 8,
        lastPracticeLocalDay: "2026-08-15",
        timeZone: "Europe/Warsaw",
      },
      NOW
    );

    expect(target?.streakDays).toBe(79);
    expect(target?.variant).toBe("d1");
    expect(target?.hoursLeft).toBe(5);
  });

  it("falls back to the stored counter when the log-derived value is absent", () => {
    const target = evaluateStreakReminder(
      {
        actualDayWithoutBreak: 8,
        lastPracticeLocalDay: "2026-08-15",
        timeZone: "Europe/Warsaw",
      },
      NOW
    );

    expect(target?.streakDays).toBe(8);
  });

  it("counts days in the user's own calendar", () => {
    // 17:00 UTC is 2026-08-17 in Auckland but still 2026-08-16 in Warsaw, so the
    // same last-practice day is a different number of days ago for each.
    const stats = { streakDays: 4, lastPracticeLocalDay: "2026-08-16" };

    expect(
      evaluateStreakReminder({ ...stats, timeZone: "Pacific/Auckland" }, NOW)
        ?.daysSincePractice
    ).toBe(1);
    expect(
      evaluateStreakReminder({ ...stats, timeZone: "Europe/Warsaw" }, NOW)
    ).toBeNull();
  });

  it("fires on day 3 with the d3 variant", () => {
    const target = evaluateStreakReminder(
      {
        streakDays: 12,
        lastPracticeLocalDay: "2026-08-13",
        timeZone: "Europe/Warsaw",
      },
      NOW
    );

    expect(target?.daysSincePractice).toBe(3);
    expect(target?.type).toBe("streak_d3");
  });

  it("stays silent on every other gap", () => {
    const at = (day: string) =>
      evaluateStreakReminder(
        { streakDays: 5, lastPracticeLocalDay: day, timeZone: "Europe/Warsaw" },
        NOW
      );

    expect(at("2026-08-16")).toBeNull(); // practised today
    expect(at("2026-08-14")).toBeNull(); // 2 days
    expect(at("2026-08-12")).toBeNull(); // 4 days
  });

  it("ignores accounts whose last practice reads as the future", () => {
    // A skewed client clock used to land here as `Math.abs(diff) === 1` and got
    // a "your streak ends tonight" mail the day before it had even started.
    expect(
      evaluateStreakReminder(
        {
          streakDays: 3,
          lastPracticeLocalDay: "2026-08-17",
          timeZone: "Europe/Warsaw",
        },
        NOW
      )
    ).toBeNull();
  });

  it("falls back to lastReportDate for accounts that never reported a zone", () => {
    const target = evaluateStreakReminder(
      { actualDayWithoutBreak: 6, lastReportDate: "2026-08-15T00:00:00.000Z" },
      NOW
    );

    expect(target?.daysSincePractice).toBe(1);
    expect(target?.streakDays).toBe(6);
    // No zone means no honest deadline — the copy says "tonight" instead.
    expect(target?.hoursLeft).toBeNull();
  });

  it("returns null for missing or unusable statistics", () => {
    expect(evaluateStreakReminder(null, NOW)).toBeNull();
    expect(evaluateStreakReminder({}, NOW)).toBeNull();
    expect(
      evaluateStreakReminder({ lastReportDate: "not-a-date" }, NOW)
    ).toBeNull();
  });
});
