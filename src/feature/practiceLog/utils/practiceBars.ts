import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

import type { DayGroup } from "../types/practiceLog.types";

export type PracticeBarUnit = "day" | "week" | "month" | "year";

export interface PracticeBar {
  /** Local midnight the bar's day, week, month or year starts on. */
  start: Date;
  totalMs: number;
}

const MIN_DAYS = 7;
const MAX_DAYS = 14;
const MAX_WEEKS = 14;
const MAX_MONTHS = 24;

const UNIT: Record<
  PracticeBarUnit,
  { startOf: (date: Date) => Date; next: (date: Date) => Date }
> = {
  day: { startOf: startOfDay, next: (date) => addDays(date, 1) },
  week: {
    startOf: (date) => startOfWeek(date, { weekStartsOn: 1 }),
    next: (date) => addWeeks(date, 1),
  },
  month: { startOf: startOfMonth, next: (date) => addMonths(date, 1) },
  year: { startOf: startOfYear, next: (date) => addYears(date, 1) },
};

/**
 * Which bars carry the year under their month, so no month has to repeat it:
 * every January, and the first bar. Empty for a row within a single year.
 */
export const yearMarks = (
  bars: PracticeBar[],
  unit: PracticeBarUnit,
): number[] => {
  const years = new Set(bars.map((bar) => bar.start.getFullYear()));
  if (unit !== "month" || years.size < 2) return [];
  return bars.flatMap((bar, index) =>
    index === 0 || bar.start.getMonth() === 0 ? [index] : [],
  );
};

const pickUnit = (first: Date, end: Date): PracticeBarUnit => {
  const days = differenceInCalendarDays(end, first) + 1;
  if (days <= MAX_DAYS) return "day";
  if (days <= MAX_WEEKS * 7) return "week";
  if (differenceInCalendarMonths(end, first) < MAX_MONTHS) return "month";
  return "year";
};

/**
 * Practice time as a handful of bars: days for up to two weeks, then weeks,
 * months and years. Empty stretches keep their (zero) bar, so the row reads as
 * a calendar, and a new player always sees at least a week of it.
 */
export const buildPracticeBars = (
  days: Pick<DayGroup, "date" | "totalTimeMs">[],
  end: Date,
): { unit: PracticeBarUnit; bars: PracticeBar[] } => {
  const lastDay = startOfDay(end);
  const earliest = days.reduce(
    (min, day) => (day.date < min ? day.date : min),
    addDays(lastDay, 1 - MIN_DAYS),
  );
  const unit = pickUnit(earliest, lastDay);
  const { startOf, next } = UNIT[unit];

  const totals = new Map<number, number>();
  days.forEach((day) => {
    const key = startOf(day.date).getTime();
    totals.set(key, (totals.get(key) ?? 0) + day.totalTimeMs);
  });

  const bars: PracticeBar[] = [];
  for (let start = startOf(earliest); start <= lastDay; start = next(start)) {
    bars.push({ start, totalMs: totals.get(start.getTime()) ?? 0 });
  }
  return { unit, bars };
};

/** The start of the bar `date` falls into — to mark the running day, week or month. */
export const barStart = (date: Date, unit: PracticeBarUnit) =>
  UNIT[unit].startOf(date);

/** "45m", "1.5h" — short enough to sit on top of a narrow bar. */
export const formatBarTime = (ms: number, locale: string) => {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  return `${(minutes / 60).toLocaleString(locale, { maximumFractionDigits: 1 })}h`;
};
