import { startOfDay } from "date-fns";

/**
 * Start of the local day of the player's first practice ever, as a timestamp;
 * Infinity for a player with no practice yet.
 *
 * Days before it are not misses — the player had not started. The week chart
 * uses it so a new account is not handed red crosses for days it did not exist.
 */
export const getFirstPracticeDay = (
  reports: readonly { date: Date }[],
): number =>
  reports.reduce(
    (first, report) =>
      Math.min(first, startOfDay(new Date(report.date)).getTime()),
    Infinity,
  );

/** True for a day the player could not have missed: it ended before they ever practised. */
export const isBeforeFirstPractice = (
  day: Date,
  firstPracticeDay: number,
): boolean => startOfDay(day).getTime() < firstPracticeDay;
