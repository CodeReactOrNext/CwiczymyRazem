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

  it("pays no rig bonus when the caller has no rig", () => {
    const result = session(60);

    expect(result.rigFame).toBe(0);
    expect(result.rigFameRate).toBe(0);
  });

  it("adds the rig bonus on top of the curve and the streak", () => {
    const plain = session(30, { streak: 7 });
    const geared = session(30, { streak: 7, rigLevel: 750 });

    expect(geared.rigFame).toBeGreaterThan(0);
    expect(geared.curveFame).toBe(plain.curveFame);
    expect(geared.streakBonus).toBe(plain.streakBonus);
    expect(geared.fame).toBe(plain.fame + geared.rigFame);
  });

  it("gives splitters no rig advantage over one long session", () => {
    let fameDay = undefined as any;
    let total = 0;

    for (let i = 0; i < 6; i++) {
      const result = calculateSessionFame({
        sessionTimeMs: 20 * MINUTE,
        dayKey: TODAY,
        streak: 1,
        fameDay,
        rigLevel: 750,
      });
      total += result.rigFame;
      fameDay = result.fameDay;
    }

    expect(total).toBe(session(120, { rigLevel: 750 }).rigFame);
  });

  it("never pays a negative rig bonus when the rig changes mid-day", () => {
    const first = session(20, { rigLevel: 750 });
    const afterSellingTheRig = calculateSessionFame({
      sessionTimeMs: 20 * MINUTE,
      dayKey: TODAY,
      streak: 1,
      fameDay: first.fameDay,
      rigLevel: 40,
    });

    expect(afterSellingTheRig.rigFame).toBeGreaterThanOrEqual(0);
  });

  it("pays the rig bonus again on a new day", () => {
    const yesterday = session(120, { rigLevel: 750 });
    const today = calculateSessionFame({
      sessionTimeMs: 30 * MINUTE,
      dayKey: "2026-08-08",
      streak: 2,
      fameDay: yesterday.fameDay,
      rigLevel: 750,
    });

    expect(today.rigFame).toBe(session(30, { rigLevel: 750 }).rigFame);
  });

  it("pays no rig bonus on a back-dated report", () => {
    const result = session(60, { rigLevel: 750, isDateBackReport: 3 });

    expect(result.fame).toBe(BACKDATED_REPORT_FAME);
    expect(result.rigFame).toBe(0);
  });

  it("still reports the rate on a back-dated report so the UI can explain it", () => {
    expect(session(60, { rigLevel: 750, isDateBackReport: 3 }).rigFameRate).toBeGreaterThan(0);
  });

  it("keeps practice worth more than gear at the average rig", () => {
    // Most players sit at rig 100–200, and there the curve has to stay the bigger
    // half — the rig is a bonus on practising, not a reason to stop.
    const result = session(25, { rigLevel: 200 });

    expect(result.rigFame).toBeLessThan(result.curveFame);
  });

  it("lets a top rig out-earn the curve, on purpose", () => {
    // The other side of that line, pinned so it can't drift back by accident:
    // 750 is the top rig in the game and it is meant to feel like it.
    const result = session(25, { rigLevel: 750 });

    expect(result.rigFame).toBeGreaterThan(result.curveFame);
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

  describe("trait fame", () => {
    it("pays nothing when the rig carries no traits", () => {
      const result = session(60, { rigLevel: 143 });

      expect(result.traitFame).toBe(0);
      expect(result.fame).toBe(result.curveFame + result.rigFame);
    });

    it("adds what the traits earned on top of the curve and the rig", () => {
      const result = session(60, { rigLevel: 143, traitFame: 20, traitRate: 20 });

      expect(result.traitFame).toBe(20);
      expect(result.fame).toBe(result.curveFame + result.rigFame + 20);
    });

    it("shares the rig ceiling instead of getting a second cap", () => {
      // The top rig pays ~60/h, so a 40/h trait build overshoots the 90/h
      // ceiling by 10 and has to give that back — scaled, so the rate the header
      // showed is the rate that got paid.
      const result = session(60, {
        rigLevel: 750,
        traitFame: 40,
        traitRate: 40,
      });

      expect(result.rigFameRate + result.traitFameRate).toBeCloseTo(90, 1);
      expect(result.traitFame).toBeLessThan(40);
    });

    it("pays no trait fame on a back-dated report", () => {
      const result = session(60, {
        rigLevel: 143,
        traitFame: 20,
        traitRate: 20,
        isDateBackReport: 2,
      });

      expect(result.traitFame).toBe(0);
      expect(result.fame).toBe(BACKDATED_REPORT_FAME);
    });

    it("pays the same split across six reports as in one", () => {
      // Trait fame is linear in time, so splitting is neutral by arithmetic —
      // unlike the curve, which needs the day counter to get there.
      const oneReport = session(90, { rigLevel: 143, traitFame: 30, traitRate: 20 });
      const split = Array.from({ length: 6 }, () =>
        session(15, { rigLevel: 143, traitFame: 5, traitRate: 20 }),
      ).reduce((total, r) => total + r.traitFame, 0);

      expect(split).toBe(oneReport.traitFame);
    });
  });
});
