import { describe, expect, it } from "vitest";

import {
  BACKDATED_REPORT_FAME,
  calculateSessionFame,
  cumulativeDailyFame,
  getStreakFameBonus,
  MAX_DAILY_CURVE_FAME,
} from "../calculateSessionFame";

const MINUTE = 60000;
const TODAY = "2026-08-07";

const session = (minutes: number, overrides: Partial<Parameters<typeof calculateSessionFame>[0]> = {}) =>
  calculateSessionFame({
    sessionTimeMs: minutes * MINUTE,
    dayKey: TODAY,
    streak: 1,
    ...overrides,
  });

describe("cumulativeDailyFame", () => {
  it("pays more per minute early in the day than late", () => {
    const firstHalfHour = cumulativeDailyFame(30);
    const secondHalfHour = cumulativeDailyFame(60) - cumulativeDailyFame(30);

    expect(firstHalfHour).toBeGreaterThan(secondHalfHour);
  });

  it("follows the published curve", () => {
    expect(cumulativeDailyFame(15)).toBe(12);
    expect(cumulativeDailyFame(30)).toBe(16);
    expect(cumulativeDailyFame(60)).toBe(23);
    expect(cumulativeDailyFame(120)).toBe(33);
    expect(cumulativeDailyFame(240)).toBe(46);
  });

  it("caps the daily curve", () => {
    expect(cumulativeDailyFame(600)).toBe(MAX_DAILY_CURVE_FAME);
    expect(cumulativeDailyFame(60 * 24)).toBe(MAX_DAILY_CURVE_FAME);
  });

  it("never goes backwards", () => {
    for (let minutes = 1; minutes <= 400; minutes++) {
      expect(cumulativeDailyFame(minutes)).toBeGreaterThanOrEqual(cumulativeDailyFame(minutes - 1));
    }
  });

  it("treats negative input as zero", () => {
    expect(cumulativeDailyFame(-10)).toBe(0);
  });
});

describe("calculateSessionFame", () => {
  it("pays the curve value for the first session of the day", () => {
    expect(session(60).fame).toBe(23);
  });

  it("gives splitters no advantage over one long session", () => {
    let fameDay = undefined as any;
    let total = 0;

    for (let i = 0; i < 6; i++) {
      const result = calculateSessionFame({
        sessionTimeMs: 20 * MINUTE,
        dayKey: TODAY,
        streak: 1,
        fameDay,
      });
      total += result.fame;
      fameDay = result.fameDay;
    }

    expect(total).toBe(session(120).fame);
  });

  it("resets the counter on a new day", () => {
    const yesterday = session(120);
    const today = calculateSessionFame({
      sessionTimeMs: 60 * MINUTE,
      dayKey: "2026-08-08",
      streak: 2,
      fameDay: yesterday.fameDay,
    });

    expect(today.fame).toBe(23);
    expect(today.fameDay.minutes).toBe(60);
  });

  it("stops paying the curve once the daily cap is reached", () => {
    const first = session(600);
    const second = calculateSessionFame({
      sessionTimeMs: 60 * MINUTE,
      dayKey: TODAY,
      streak: 1,
      fameDay: first.fameDay,
    });

    expect(first.curveFame).toBe(MAX_DAILY_CURVE_FAME);
    expect(second.curveFame).toBe(0);
  });

  it("keeps sub-minute practice from paying zero", () => {
    expect(session(0.5).fame).toBeGreaterThan(0);
  });

  it("pays nothing for an empty session", () => {
    const result = session(0);

    expect(result.fame).toBe(0);
    expect(result.streakBonus).toBe(0);
  });

  it("multiplies the curve on a high-accuracy session", () => {
    const plain = session(60);
    const accurate = session(60, { accuracy: 96 });

    expect(accurate.accuracyBonusApplied).toBe(true);
    expect(accurate.curveFame).toBe(Math.round(plain.curveFame * 1.25));
  });

  it("leaves a low-accuracy session on the plain curve", () => {
    const result = session(60, { accuracy: 70 });

    expect(result.accuracyBonusApplied).toBe(false);
    expect(result.curveFame).toBe(session(60).curveFame);
  });

  it("adds the flat streak bonus once per day", () => {
    const first = session(30, { streak: 7 });
    const second = calculateSessionFame({
      sessionTimeMs: 30 * MINUTE,
      dayKey: TODAY,
      streak: 7,
      fameDay: first.fameDay,
    });

    expect(first.streakBonus).toBe(8);
    expect(second.streakBonus).toBe(0);
  });

  it("scales the streak bonus by tier", () => {
    expect(getStreakFameBonus(1)).toBe(0);
    expect(getStreakFameBonus(3)).toBe(3);
    expect(getStreakFameBonus(7)).toBe(8);
    expect(getStreakFameBonus(30)).toBe(15);
    expect(getStreakFameBonus(365)).toBe(15);
  });

  it("pays back-dated reports a flat token and leaves today's counter alone", () => {
    const earlier = session(60);
    const backdated = calculateSessionFame({
      sessionTimeMs: 180 * MINUTE,
      dayKey: TODAY,
      streak: 10,
      fameDay: earlier.fameDay,
      isDateBackReport: 3,
    });

    expect(backdated.fame).toBe(BACKDATED_REPORT_FAME);
    expect(backdated.fameDay).toEqual(earlier.fameDay);
  });

  it("rewards four days of one hour over a single four-hour day", () => {
    const marathon = session(240).fame;
    const spread = [1, 2, 3, 4].reduce((total, day) => {
      const result = calculateSessionFame({
        sessionTimeMs: 60 * MINUTE,
        dayKey: `2026-08-0${day}`,
        streak: day,
      });
      return total + result.fame;
    }, 0);

    expect(spread).toBeGreaterThan(marathon);
  });
});
