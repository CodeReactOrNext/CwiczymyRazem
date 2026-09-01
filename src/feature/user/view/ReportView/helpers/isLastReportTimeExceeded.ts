/** Anything carrying a report instant — the activity log's collapsed day entries. */
interface ReportInstantSource {
  date: Date | string;
  /**
   * The latest raw log of that day. The activity log collapses a day's reports
   * into one entry whose `date` is the *first* of them, so a day with several
   * sessions needs this to point at the most recent one.
   */
  lastActivityDate?: Date | string;
}

const toTime = (value: Date | string | undefined): number | null => {
  if (value === undefined) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
};

/**
 * The instant of the user's most recent report, or `null` when the activity log
 * has nothing to offer (still loading, or a first-ever report).
 */
export const getLastReportInstant = (
  reports: readonly ReportInstantSource[] | null | undefined
): number | null => {
  if (!reports?.length) return null;

  let latest: number | null = null;

  for (const report of reports) {
    const time = toTime(report.lastActivityDate) ?? toTime(report.date);
    if (time !== null && (latest === null || time > latest)) latest = time;
  }

  return latest;
};

/**
 * How much of the reported time could not have been practised since the previous
 * report, in ms — `false` when the entry fits inside the elapsed window.
 *
 * Takes a real report instant (see `getLastReportInstant`), **not**
 * `statistics.lastReportDate`: that field stores UTC-midnight of the reporter's
 * local day (reportUpdateUserStats), so passing it here measured the session
 * against midnight rather than against the last report. For a user at UTC+X that
 * midnight lands at X:00 *local*, which made every second report of the day fire
 * this warning until X + sessionLength had passed on their clock.
 *
 * No known last report means there is no window to measure, so the entry passes.
 */
export const isLastReportTimeExceeded = (
  lastReportAt: number | null | undefined,
  sumTime: number,
  now: number = Date.now()
): number | false => {
  if (lastReportAt === null || lastReportAt === undefined) return false;
  // A skewed clock can put the stored report ahead of "now"; there is no elapsed
  // window to judge against then either, so don't invent one.
  if (lastReportAt > now) return false;

  const excess = lastReportAt + sumTime - now;
  return excess > 0 ? excess : false;
};
