import { addDays, dateRange, startOfWeek } from "./calendarDates";

export type PlanRange = "rest_of_week" | "next_week" | "two_weeks";

export const PLAN_RANGES: PlanRange[] = [
  "rest_of_week",
  "next_week",
  "two_weeks",
];

export const isPlanRange = (value: unknown): value is PlanRange =>
  PLAN_RANGES.some((range) => range === value);

/** The days each range covers, counted from today. */
export const rangeDates = (range: PlanRange, today: string) => {
  const nextMonday = addDays(startOfWeek(today), 7);
  if (range === "next_week")
    return dateRange(nextMonday, addDays(nextMonday, 6));
  if (range === "two_weeks") return dateRange(today, addDays(nextMonday, 6));
  return dateRange(today, addDays(nextMonday, -1));
};
