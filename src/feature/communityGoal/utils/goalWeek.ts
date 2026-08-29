/**
 * Weeks run Monday to Monday in UTC, matching how the rest of the app talks
 * about a practice week. Everything here is pure so the rollover, the progress
 * query and the claim check can all agree on the same boundaries without
 * passing dates around.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight UTC on the Monday of the week containing `date`. */
export const weekStart = (date: Date = new Date()): Date => {
  const utc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  // getUTCDay: Sunday is 0, so Sunday belongs to the week that began 6 days ago.
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(utc - daysSinceMonday * DAY_MS);
};

export const weekEnd = (date: Date = new Date()): Date =>
  new Date(weekStart(date).getTime() + 7 * DAY_MS);

/**
 * Identifier for a week, e.g. "2026-W35". Derived from the Monday's own date
 * rather than the ISO week number: the two disagree at year boundaries, and the
 * only thing that matters here is that consecutive Mondays get distinct,
 * sortable ids.
 */
export const weekIdOf = (date: Date = new Date()): string => {
  const monday = weekStart(date);
  const yearStart = Date.UTC(monday.getUTCFullYear(), 0, 1);
  const week = Math.floor((monday.getTime() - yearStart) / (7 * DAY_MS)) + 1;
  return `${monday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

export const previousWeekId = (date: Date = new Date()): string =>
  weekIdOf(new Date(weekStart(date).getTime() - DAY_MS));

export const nextWeekId = (date: Date = new Date()): string =>
  weekIdOf(weekEnd(date));

/** Milliseconds of practice, as the hours a goal is stated in. */
export const msToHours = (ms: number): number =>
  Math.max(0, Math.floor((Number.isFinite(ms) ? ms : 0) / 3_600_000));
