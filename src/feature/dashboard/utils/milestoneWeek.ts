import type {
  LevelDef,
  ProgressData,
} from "feature/aiSummary/utils/milestoneLogic";
import {
  currentWeekDates,
  localDateStr,
  MS_15,
} from "feature/aiSummary/utils/milestoneLogic";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";

/** One day of the current week, as a milestone chart needs it. */
export interface MilestoneDay {
  date: Date;
  /** Single letter for the axis: M, T, W… */
  label: string;
  minutes: number;
  /** Minutes per practice category that day — what the all-round tiers measure. */
  categories: { tech: number; theory: number; hearing: number; creat: number };
  isToday: boolean;
  isFuture: boolean;
}

/** Which chart shape reads a tier's week. */
export type MilestoneChartKind =
  | "week-bars"
  | "streak-simple"
  | "week-cats"
  | "streak-cats";

/** What a tier asks of a single day. */
export type MilestoneDayRule =
  | { kind: "minutes"; goalMin: number }
  | { kind: "allCategories"; goalMin: number };

const ZERO_PROGRESS: ProgressData = {
  daysIn7With15: 0,
  daysIn7With20: 0,
  streak15: 0,
  allCatsThisWeek: 0,
  daysIn7AllCats: 0,
  streakAllCats: 0,
};

/**
 * Which of the week's signals a tier actually reads, asked of the tier itself.
 *
 * The alternative was a second list of "these tier numbers are the all-round
 * ones" sitting away from the tier table, which is exactly the kind of pair
 * that drifts the first time a tier is renumbered. Feeding the tier a week in
 * which only one signal moved and watching whether its own progress moves is a
 * question the table can always answer for itself.
 */
const readsSignal = (tier: LevelDef, field: keyof ProgressData): boolean =>
  tier.getProgress({ ...ZERO_PROGRESS, [field]: 7 }).value > 0;

/**
 * The per-day bar a tier sets: either minutes at the guitar, or minutes in each
 * of the four categories. The 15-minute floor on a category is fixed by the
 * goals themselves ("all 4 categories at 15+ min"); only the plain-minutes
 * tiers move their bar, and only Groove moves it, to 20.
 */
export const milestoneDayRule = (tier: LevelDef): MilestoneDayRule =>
  readsSignal(tier, "daysIn7AllCats") || readsSignal(tier, "streakAllCats")
    ? { kind: "allCategories", goalMin: MS_15 / 60000 }
    : { kind: "minutes", goalMin: tier.dayGoalMin ?? MS_15 / 60000 };

/** Whether one day cleared the bar its tier sets. */
export const dayMeetsRule = (
  day: MilestoneDay,
  rule: MilestoneDayRule,
): boolean => {
  if (rule.kind === "minutes") return day.minutes >= rule.goalMin;
  const { tech, theory, hearing, creat } = day.categories;
  return [tech, theory, hearing, creat].every(
    (minutes) => minutes >= rule.goalMin,
  );
};

/**
 * Which of the four charts a tier is read with — the same split the Milestones
 * page makes, asked of the tier itself rather than kept as a second list of
 * tier numbers:
 *
 * - `week-bars` — how long each day was, against a goal line (Spark, Groove, Momentum)
 * - `streak-simple` — the run of days in a row (Hot Streak, Unstoppable)
 * - `week-cats` — which of the four categories each day covered (All-Rounder)
 * - `streak-cats` — that run, with each category's progress inside the day
 */
export const milestoneChartKind = (tier: LevelDef): MilestoneChartKind =>
  readsSignal(tier, "streakAllCats")
    ? "streak-cats"
    : readsSignal(tier, "daysIn7AllCats")
      ? "week-cats"
      : readsSignal(tier, "streak15")
        ? "streak-simple"
        : "week-bars";

/**
 * Which days belong to the run the player is on right now: walk back from the
 * last day that has happened and stop at the first one that missed. Today not
 * being finished yet does not break a run, so a streak that ended yesterday
 * still shows while today is still open — the same allowance the Milestones
 * page makes.
 */
export const milestoneStreakDays = (
  days: MilestoneDay[],
  rule: MilestoneDayRule,
): boolean[] => {
  const inStreak = days.map(() => false);

  let index = days.length - 1;
  while (index >= 0 && days[index].isFuture) index -= 1;
  if (index >= 0 && !dayMeetsRule(days[index], rule)) index -= 1;

  for (; index >= 0; index -= 1) {
    if (!dayMeetsRule(days[index], rule)) break;
    inStreak[index] = true;
  }

  return inStreak;
};

const toMinutes = (ms: number): number => Math.round(ms / 60000);

/**
 * The seven days of the week the player is in, Monday first, each carrying the
 * time logged against it. Built from the same logs and the same local-day keys
 * `computeProgressData` counts with, so a bar can never disagree with the
 * number printed next to it.
 */
export const milestoneWeekDays = (
  logs: FirebaseUserExceriseLog[],
  today: Date,
): MilestoneDay[] => {
  const byDate = new Map<
    string,
    {
      sumTime: number;
      tech: number;
      theory: number;
      hearing: number;
      creat: number;
    }
  >();

  logs.forEach((log) => {
    const seconds = log.reportDate?.seconds;
    if (typeof seconds !== "number") return;
    const key = localDateStr(new Date(seconds * 1000));
    const prev = byDate.get(key) ?? {
      sumTime: 0,
      tech: 0,
      theory: 0,
      hearing: 0,
      creat: 0,
    };
    byDate.set(key, {
      sumTime: prev.sumTime + (log.timeSumary?.sumTime ?? 0),
      tech: prev.tech + (log.timeSumary?.techniqueTime ?? 0),
      theory: prev.theory + (log.timeSumary?.theoryTime ?? 0),
      hearing: prev.hearing + (log.timeSumary?.hearingTime ?? 0),
      creat: prev.creat + (log.timeSumary?.creativityTime ?? 0),
    });
  });

  const todayTime = today.getTime();

  return currentWeekDates(today).map((date) => {
    const stats = byDate.get(localDateStr(date));
    return {
      date,
      label: date.toLocaleDateString("en-US", { weekday: "narrow" }),
      minutes: toMinutes(stats?.sumTime ?? 0),
      categories: {
        tech: toMinutes(stats?.tech ?? 0),
        theory: toMinutes(stats?.theory ?? 0),
        hearing: toMinutes(stats?.hearing ?? 0),
        creat: toMinutes(stats?.creat ?? 0),
      },
      isToday: date.getTime() === todayTime,
      isFuture: date.getTime() > todayTime,
    };
  });
};
