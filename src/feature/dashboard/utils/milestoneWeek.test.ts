import { LEVELS, MS_15 } from "feature/aiSummary/utils/milestoneLogic";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import { describe, expect, it } from "vitest";

import {
  dayMeetsRule,
  milestoneChartKind,
  milestoneDayRule,
  milestoneStreakDays,
  milestoneWeekDays,
} from "./milestoneWeek";

/** Wednesday, so the week has days behind it and days ahead of it. */
const WEDNESDAY = new Date(2026, 8, 9);

const MIN = 60 * 1000;

const log = (
  date: Date,
  times: Partial<{
    sumTime: number;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }>,
): FirebaseUserExceriseLog =>
  ({
    reportDate: { seconds: Math.floor(date.getTime() / 1000) },
    timeSumary: {
      sumTime: 0,
      techniqueTime: 0,
      theoryTime: 0,
      hearingTime: 0,
      creativityTime: 0,
      ...times,
    },
  }) as unknown as FirebaseUserExceriseLog;

const tierNamed = (name: string) => {
  const tier = LEVELS.find((entry) => entry.name === name);
  if (!tier) throw new Error(`no tier called ${name}`);
  return tier;
};

describe("milestoneWeekDays", () => {
  it("returns the seven days of the current week, Monday first", () => {
    const days = milestoneWeekDays([], WEDNESDAY);

    expect(days).toHaveLength(7);
    expect(days[0].date.getDay()).toBe(1);
    expect(days[6].date.getDay()).toBe(0);
  });

  it("marks today and the days still to come", () => {
    const days = milestoneWeekDays([], WEDNESDAY);

    expect(days.filter((day) => day.isToday)).toHaveLength(1);
    expect(days[2].isToday).toBe(true);
    expect(days.slice(0, 2).every((day) => !day.isFuture)).toBe(true);
    expect(days.slice(3).every((day) => day.isFuture)).toBe(true);
  });

  it("adds up several sessions logged on the same day", () => {
    const monday = new Date(2026, 8, 7, 10);
    const days = milestoneWeekDays(
      [
        log(monday, { sumTime: 12 * MIN, techniqueTime: 12 * MIN }),
        log(new Date(2026, 8, 7, 20), {
          sumTime: 18 * MIN,
          theoryTime: 18 * MIN,
        }),
      ],
      WEDNESDAY,
    );

    expect(days[0].minutes).toBe(30);
    expect(days[0].categories).toEqual({
      tech: 12,
      theory: 18,
      hearing: 0,
      creat: 0,
    });
  });

  it("ignores sessions outside the current week and logs with no date", () => {
    const lastWeek = new Date(2026, 8, 1, 10);
    const days = milestoneWeekDays(
      [
        log(lastWeek, { sumTime: 99 * MIN }),
        {
          timeSumary: { sumTime: 99 * MIN },
        } as unknown as FirebaseUserExceriseLog,
      ],
      WEDNESDAY,
    );

    expect(days.every((day) => day.minutes === 0)).toBe(true);
  });
});

describe("milestoneDayRule", () => {
  it("reads a plain-minutes tier's own daily bar", () => {
    expect(milestoneDayRule(tierNamed("Spark"))).toEqual({
      kind: "minutes",
      goalMin: 15,
    });
    // Groove is the one tier that raises the bar.
    expect(milestoneDayRule(tierNamed("Groove"))).toEqual({
      kind: "minutes",
      goalMin: 20,
    });
    expect(milestoneDayRule(tierNamed("Hot Streak"))).toEqual({
      kind: "minutes",
      goalMin: 15,
    });
  });

  it("spots the all-round tiers from what their own progress reacts to", () => {
    ["All-Rounder", "In the Zone", "Shredder", "Virtuoso"].forEach((name) => {
      expect(milestoneDayRule(tierNamed(name))).toEqual({
        kind: "allCategories",
        goalMin: MS_15 / 60000,
      });
    });
  });

  it("classifies every tier as one rule or the other", () => {
    LEVELS.forEach((tier) => {
      const rule = milestoneDayRule(tier);
      expect(["minutes", "allCategories"]).toContain(rule.kind);
      expect(rule.goalMin).toBeGreaterThan(0);
    });
  });
});

describe("dayMeetsRule", () => {
  const day = (
    minutes: number,
    categories = { tech: 0, theory: 0, hearing: 0, creat: 0 },
  ) => ({
    date: WEDNESDAY,
    label: "W",
    minutes,
    categories,
    isToday: true,
    isFuture: false,
  });

  it("clears a minutes rule at the bar, not above it", () => {
    const rule = { kind: "minutes", goalMin: 20 } as const;
    expect(dayMeetsRule(day(19), rule)).toBe(false);
    expect(dayMeetsRule(day(20), rule)).toBe(true);
  });

  it("wants all four categories, not just enough total minutes", () => {
    const rule = { kind: "allCategories", goalMin: 15 } as const;
    expect(
      dayMeetsRule(
        day(90, { tech: 90, theory: 0, hearing: 0, creat: 0 }),
        rule,
      ),
    ).toBe(false);
    expect(
      dayMeetsRule(
        day(60, { tech: 15, theory: 15, hearing: 15, creat: 15 }),
        rule,
      ),
    ).toBe(true);
  });
});

describe("milestoneChartKind", () => {
  it("gives the plain-minutes tiers the bar chart", () => {
    ["Spark", "Groove", "Momentum"].forEach((name) => {
      expect(milestoneChartKind(tierNamed(name)), name).toBe("week-bars");
    });
  });

  it("gives the streak tiers the run of days", () => {
    ["Hot Streak", "Unstoppable"].forEach((name) => {
      expect(milestoneChartKind(tierNamed(name)), name).toBe("streak-simple");
    });
  });

  it("separates the all-round count from the all-round streak", () => {
    // All-Rounder counts days; the three above it want them consecutive, and a
    // chart that cannot tell those apart is the reason this split exists.
    expect(milestoneChartKind(tierNamed("All-Rounder"))).toBe("week-cats");
    ["In the Zone", "Shredder", "Virtuoso"].forEach((name) => {
      expect(milestoneChartKind(tierNamed(name)), name).toBe("streak-cats");
    });
  });

  it("never leaves a tier without a chart", () => {
    LEVELS.forEach((tier) => {
      expect(
        ["week-bars", "streak-simple", "week-cats", "streak-cats"],
        tier.name,
      ).toContain(milestoneChartKind(tier));
    });
  });
});

describe("milestoneStreakDays", () => {
  const RULE = { kind: "minutes", goalMin: 15 } as const;

  /** A week whose Monday…Sunday minutes are given, read on the Wednesday. */
  const week = (minutes: number[]) =>
    milestoneWeekDays(
      minutes.flatMap((mins, index) =>
        mins > 0
          ? [log(new Date(2026, 8, 7 + index, 10), { sumTime: mins * MIN })]
          : [],
      ),
      WEDNESDAY,
    );

  it("lights the run that is still going, not every day that cleared the bar", () => {
    // Monday cleared, Tuesday missed, Wednesday cleared: only today is running.
    expect(milestoneStreakDays(week([20, 0, 20, 0, 0, 0, 0]), RULE)).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it("counts back through every day of the run", () => {
    expect(milestoneStreakDays(week([20, 20, 20, 0, 0, 0, 0]), RULE)).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it("keeps yesterday's run alive while today is still unplayed", () => {
    // Today being empty at breakfast is not a broken streak yet.
    expect(milestoneStreakDays(week([20, 20, 0, 0, 0, 0, 0]), RULE)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("lights nothing once the run is actually broken", () => {
    expect(milestoneStreakDays(week([20, 0, 0, 0, 0, 0, 0]), RULE)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("asks the all-round rule for all four categories", () => {
    const rule = { kind: "allCategories", goalMin: 15 } as const;
    const days = milestoneWeekDays(
      [
        log(new Date(2026, 8, 8, 10), {
          sumTime: 60 * MIN,
          techniqueTime: 15 * MIN,
          theoryTime: 15 * MIN,
          hearingTime: 15 * MIN,
          creativityTime: 15 * MIN,
        }),
        // Wednesday is long but lopsided — plenty of minutes, one category.
        log(new Date(2026, 8, 9, 10), {
          sumTime: 90 * MIN,
          techniqueTime: 90 * MIN,
        }),
      ],
      WEDNESDAY,
    );

    expect(milestoneStreakDays(days, rule)).toEqual([
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});
