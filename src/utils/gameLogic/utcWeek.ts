/**
 * Weeks run Monday to Monday in UTC, matching how the rest of the app talks
 * about a practice week. Pure, so the reset schedule and the supporter case
 * cycle agree on the same boundaries without passing dates around.
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
