import { getStreakFromActivityLog } from "./getStreakFromActivityLog";
import { getLocalDayKey } from "./localDay";

/**
 * Everything about the *client's* clock that a report has to carry to the
 * server. The server runs in UTC and never sees the user's activity log, so any
 * of these it has to guess it guesses wrong for part of every day.
 */
export interface ClientReportContext {
  /** The user's local calendar day, `YYYY-MM-DD`. */
  clientTodayISO: string;
  /** The real submission instant, so the report lands on the right day everywhere. */
  clientNowISO: string;
  /**
   * Streak derived from the local-time activity log — the number the UI shows.
   * The stored `actualDayWithoutBreak` counter drifts after a timezone slip and
   * cannot self-heal (see getReconciledStreak), so this is the trustworthy one.
   */
  clientDisplayStreak: number;
  /** IANA zone, e.g. "Europe/Warsaw". Empty when the browser won't say. */
  clientTimeZone: string;
}

const resolveTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

export const getClientReportContext = (
  reportDates: Array<Date | string | null | undefined>,
  now: Date = new Date()
): ClientReportContext => ({
  clientTodayISO: getLocalDayKey(now),
  clientNowISO: now.toISOString(),
  clientDisplayStreak: getStreakFromActivityLog(
    reportDates,
    { includeToday: true },
    now
  ),
  clientTimeZone: resolveTimeZone(),
});
