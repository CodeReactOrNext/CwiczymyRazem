import type { Weekday } from "../types/calendar.types";

const pad = (value: number) => String(value).padStart(2, "0");

/** A local calendar day as "YYYY-MM-DD" — the key every day is stored under. */
export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Local midnight of a "YYYY-MM-DD" key. */
export const fromDateKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (key: string, days: number) => {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

export const weekdayOf = (key: string) => fromDateKey(key).getDay() as Weekday;

/** The Monday of the week a day falls in — weeks run Monday to Sunday. */
export const startOfWeek = (key: string) =>
  addDays(key, -((weekdayOf(key) + 6) % 7));

export const weekDates = (anyDayKey: string) => {
  const monday = startOfWeek(anyDayKey);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
};

/** Every day from `from` to `to`, both included. */
export const dateRange = (from: string, to: string) => {
  const dates: string[] = [];
  for (let key = from; key <= to; key = addDays(key, 1)) dates.push(key);
  return dates;
};

/** Mon … Sun, the order the week is drawn in. */
export const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
