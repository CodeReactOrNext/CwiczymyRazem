// Imported from the module rather than the `utils/gameLogic` barrel: these are
// pure date helpers, and the barrel would drag the achievements graph into the
// cron route with them.
import {
  daysBetweenDayKeys,
  getHoursUntilLocalMidnight,
  getLocalDayKey,
} from "utils/gameLogic/localDay";

import type { StreakEmailVariant } from "./templates/StreakReminderEmail";

/**
 * Decides whether a stored user document is due a streak reminder, and with
 * which numbers.
 *
 * Kept out of the cron route so the rules are testable and so the admin
 * "send manually" screen picks the exact same recipients the cron would.
 */

/** The slice of `users/{uid}.statistics` this decision needs. */
export interface StreakCandidateStats {
  streakDays?: number;
  actualDayWithoutBreak?: number;
  lastReportDate?: string;
  lastPracticeLocalDay?: string;
  timeZone?: string;
}

export type StreakEmailType = "streak_d1" | "streak_d3";

export interface StreakReminderTarget {
  /** Whole days since the last practice, in the user's own calendar. */
  daysSincePractice: 1 | 3;
  variant: StreakEmailVariant;
  type: StreakEmailType;
  /** Streak to print — the app's number when we have it. */
  streakDays: number;
  /** Hours before the streak actually dies; null when the zone is unknown. */
  hoursLeft: number | null;
}

const asString = (value: unknown): string | null =>
  typeof value === "string" && value ? value : null;

const asNonNegativeInt = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;

/**
 * Days since the last practice, counted in whichever calendar we can trust.
 *
 * Preferred: `lastPracticeLocalDay` against today in the user's own zone — both
 * sides are plain day strings, so no offset ever enters the arithmetic.
 *
 * Fallback for accounts that have not reported since per-user scheduling
 * shipped: `lastReportDate`, which is stored as UTC-midnight of the reporter's
 * local day, compared against the UTC day. That is the pre-existing behaviour
 * and it is off by a day for part of the world — which is precisely why the
 * field above exists and takes precedence the moment it appears.
 */
const getDaysSincePractice = (
  statistics: StreakCandidateStats,
  now: Date
): number | null => {
  const localDay = asString(statistics.lastPracticeLocalDay);
  if (localDay) {
    return daysBetweenDayKeys(
      localDay,
      getLocalDayKey(now, statistics.timeZone)
    );
  }

  const lastReportDate = asString(statistics.lastReportDate);
  if (!lastReportDate) return null;

  const parsed = new Date(lastReportDate);
  if (isNaN(parsed.getTime())) return null;

  return daysBetweenDayKeys(
    parsed.toISOString().slice(0, 10),
    now.toISOString().slice(0, 10)
  );
};

export const evaluateStreakReminder = (
  statistics: StreakCandidateStats | null | undefined,
  now: Date = new Date()
): StreakReminderTarget | null => {
  if (!statistics) return null;

  const daysSincePractice = getDaysSincePractice(statistics, now);
  // Only ever 1 or 3. A signed comparison also drops clock-skewed accounts whose
  // last practice reads as the future — the old `Math.abs` treated those as
  // lapsed and mailed them.
  if (daysSincePractice !== 1 && daysSincePractice !== 3) return null;

  const streakDays =
    asNonNegativeInt(statistics.streakDays) ??
    asNonNegativeInt(statistics.actualDayWithoutBreak) ??
    0;

  return {
    daysSincePractice,
    variant: daysSincePractice === 1 ? "d1" : "d3",
    type: daysSincePractice === 1 ? "streak_d1" : "streak_d3",
    streakDays,
    hoursLeft: getHoursUntilLocalMidnight(now, statistics.timeZone),
  };
};
