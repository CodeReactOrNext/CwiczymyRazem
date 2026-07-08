import { checkIsPracticeToday } from "./checkIsPracticeToday";
import { getUpdatedActualDayWithoutBreak } from "./getUpdatedActualDayWithoutBreak";

/**
 * Returns the user's local calendar date as a Date at UTC midnight.
 *
 * The streak helpers compare dates via getUTC* methods, and `lastReportDate`
 * is stored as UTC-midnight of the user's *local* date (see reportUpdateUserState).
 * Using a raw `new Date()` here would leak the real UTC instant, which lags the
 * local date by the timezone offset (e.g. 00:00–02:00 in UTC+2), making the
 * displayed streak flip as wall-clock time crosses UTC midnight. Anchoring to the
 * local date at UTC midnight keeps display and server in sync.
 */
const getLocalDateAsUtcMidnight = (now: Date = new Date()): Date => {
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
};

interface DisplayStreakInput {
  actualDayWithoutBreak: number;
  lastReportDate: string;
}

interface DisplayStreak {
  didPracticeToday: boolean;
  /** Streak value to render (0 when the streak is broken). */
  dayWithoutBreak: number;
}

/**
 * Computes the streak as it should be displayed in the UI, using the user's
 * local date so it stays consistent with how the server stores/updates it.
 */
export const getDisplayStreak = (
  { actualDayWithoutBreak, lastReportDate }: DisplayStreakInput,
  now: Date = new Date()
): DisplayStreak => {
  const baseDate = getLocalDateAsUtcMidnight(now);
  const userLastReportDate = new Date(lastReportDate);

  const didPracticeToday = checkIsPracticeToday(userLastReportDate, baseDate);
  const isStreak = getUpdatedActualDayWithoutBreak(
    actualDayWithoutBreak,
    userLastReportDate,
    didPracticeToday,
    baseDate
  );

  const dayWithoutBreak =
    isStreak === 1 && !didPracticeToday ? 0 : actualDayWithoutBreak;

  return { didPracticeToday, dayWithoutBreak };
};
