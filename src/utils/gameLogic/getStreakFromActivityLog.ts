/**
 * Reconstructs the streak (consecutive practice days) directly from the activity
 * log instead of trusting the stored `actualDayWithoutBreak` counter.
 *
 * Why: the stored counter is mutated on every report and a single timezone slip
 * (a `lastReportDate` that lands on the wrong UTC calendar day) permanently
 * resets it to 1 — there is no way to recover the lost streak afterwards. The
 * activity log, however, keeps the real practice timestamps. Converting each one
 * back to the *user's local* calendar day and counting consecutive days is
 * therefore both self-healing and timezone-correct, matching how the rest of the
 * UI (week strip, charts) renders dates in local time.
 */

/** Local calendar-day key (timezone-safe; never serializes through UTC). */
const localDayKey = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

interface StreakFromLogOptions {
  /**
   * Force today to count as practiced even if the freshly-submitted report has
   * not yet been re-fetched into the log (the stored state updates instantly,
   * the cached log can lag). Pass `didPracticeToday` from the stored state here.
   */
  includeToday?: boolean;
}

export const getStreakFromActivityLog = (
  reportDates: Array<Date | string | null | undefined>,
  { includeToday = false }: StreakFromLogOptions = {},
  now: Date = new Date()
): number => {
  const practicedDays = new Set<string>();

  for (const raw of reportDates) {
    if (!raw) continue;
    const date = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(date.getTime())) continue;
    practicedDays.add(localDayKey(date));
  }

  // Anchor on the user's local "today" at local midnight so the cursor walks
  // calendar days (handles month/year boundaries and DST via Date arithmetic).
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (includeToday) {
    practicedDays.add(localDayKey(cursor));
  }

  // The streak is alive if the user practiced today or yesterday; otherwise it
  // is broken. Start counting from whichever of those days has a report.
  if (!practicedDays.has(localDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!practicedDays.has(localDayKey(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (practicedDays.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

/**
 * The longest run of consecutive practice days anywhere in the log, in the
 * user's local calendar.
 *
 * The stored `dayWithoutBreak` record is a high-water mark of the drift-prone
 * counter, so the timezone slip that reset the counter to 1 also froze the
 * record at whatever it had reached — which is why the "100 days" badge can read
 * 41/100 for a player the app itself shows a 100+ day streak for. Walking the
 * log heals the record the same way `getStreakFromActivityLog` heals the current
 * streak, and for the same reason: the log keeps the real practice instants and
 * renders them in the viewer's local time.
 */
export const getLongestStreakFromActivityLog = (
  reportDates: Array<Date | string | null | undefined>
): number => {
  // Keyed by local day so multiple reports on one day count once, and holding
  // the day at local midnight so the walk below does calendar arithmetic (DST
  // and month/year boundaries handled by Date itself).
  const practicedDays = new Map<string, Date>();

  for (const raw of reportDates) {
    if (!raw) continue;
    const date = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(date.getTime())) continue;
    const midnight = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    practicedDays.set(localDayKey(midnight), midnight);
  }

  const days = [...practicedDays.values()].sort(
    (a, b) => a.getTime() - b.getTime()
  );

  let longest = 0;
  let run = 0;
  let previous: Date | null = null;

  for (const day of days) {
    if (previous) {
      const expected = new Date(previous);
      expected.setDate(expected.getDate() + 1);
      run = localDayKey(expected) === localDayKey(day) ? run + 1 : 1;
    } else {
      run = 1;
    }

    if (run > longest) longest = run;
    previous = day;
  }

  return longest;
};
