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
 *
 * Rest days: one missed day per calendar week (Monday to Sunday, the same week
 * the header strip shows) does not break the streak. It bridges the gap without
 * adding a day, so the number still counts days actually played. Two missed
 * days in a row, or a second one in the same week, break it. Nothing is stored —
 * the rest day is read off the log like everything else.
 *
 * The log is walked oldest first, so a rest day depends only on the days before
 * it: once the strip has shown one, a later miss can never move it elsewhere.
 */

/**
 * Only missed days from here on can be rest days. Without a start date the rule
 * would apply to the whole history and rewrite old streaks and records
 * overnight, which reads as a bug rather than a feature.
 */
export const REST_DAYS_SINCE = new Date(2026, 9, 26);

/** Whether the player has rest days on — everyone does until they switch them off. */
export const hasRestDays = (
  statistics: { streakRestDays?: boolean } | null | undefined
): boolean => statistics?.streakRestDays !== false;

/** Local calendar-day key (timezone-safe; never serializes through UTC). */
const localDayKey = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** The Monday of the day's week, as a day key. */
const weekKey = (day: Date): string => {
  const monday = new Date(day);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return localDayKey(monday);
};

const addDays = (day: Date, amount: number): Date => {
  const result = new Date(day);
  result.setDate(result.getDate() + amount);
  return result;
};

const isSameLocalDay = (a: Date, b: Date) => localDayKey(a) === localDayKey(b);

/**
 * Practiced days at local midnight, oldest first, one per day — so the walk
 * below does calendar arithmetic (DST and month/year boundaries handled by Date).
 */
const toPracticedDays = (
  reportDates: Array<Date | string | null | undefined>
): Date[] => {
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
  return [...practicedDays.values()].sort((a, b) => a.getTime() - b.getTime());
};

interface Run {
  length: number;
  /** Last practiced day of the run. */
  end: Date;
  /** Missed days the run was carried over, oldest first. */
  restDays: Date[];
  /** Weeks whose rest day this run has taken. */
  restWeeks: Set<string>;
}

const canRestOn = (missed: Date, run: Run, restDays: boolean) =>
  restDays &&
  missed.getTime() >= REST_DAYS_SINCE.getTime() &&
  !run.restWeeks.has(weekKey(missed));

const startRun = (day: Date): Run => ({
  length: 1,
  end: day,
  restDays: [],
  restWeeks: new Set(),
});

/** Walks the days oldest first; returns the longest run and the last one. */
const walkRuns = (days: Date[], restDays: boolean) => {
  let longest = 0;
  let run: Run | null = null;

  for (const day of days) {
    const next = run && addDays(run.end, 1);
    if (run && next && isSameLocalDay(next, day)) {
      run.length += 1;
      run.end = day;
    } else if (
      run &&
      next &&
      isSameLocalDay(addDays(next, 1), day) &&
      canRestOn(next, run, restDays)
    ) {
      // Exactly one missed day (`next`), and its week's rest day is free.
      run.restWeeks.add(weekKey(next));
      run.restDays.push(next);
      run.length += 1;
      run.end = day;
    } else {
      run = startRun(day);
    }
    if (run.length > longest) longest = run.length;
  }

  return { longest, last: run };
};

interface StreakFromLogOptions {
  /**
   * Force today to count as practiced even if the freshly-submitted report has
   * not yet been re-fetched into the log (the stored state updates instantly,
   * the cached log can lag). Pass `didPracticeToday` from the stored state here.
   */
  includeToday?: boolean;
  /** The player's rest-day setting (`statistics.streakRestDays`), on by default. */
  restDays?: boolean;
}

export interface StreakWalk {
  streak: number;
  /** Missed days the current streak was carried over, newest first. */
  restDayDates: Date[];
}

export const getStreakWalk = (
  reportDates: Array<Date | string | null | undefined>,
  { includeToday = false, restDays = true }: StreakFromLogOptions = {},
  now: Date = new Date()
): StreakWalk => {
  // Anchor on the user's local "today" at local midnight so the walk counts
  // calendar days. Days after today (a skewed clock) are left out.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = toPracticedDays(
    includeToday ? [...reportDates, today] : reportDates
  ).filter((day) => day.getTime() <= today.getTime());

  const { last } = walkRuns(days, restDays);
  if (!last) return { streak: 0, restDayDates: [] };

  const yesterday = addDays(today, -1);
  const restDayDates = [...last.restDays].reverse();

  // Today is still open until midnight, so the streak is alive while the last
  // practice was today or yesterday...
  if (isSameLocalDay(last.end, today) || isSameLocalDay(last.end, yesterday)) {
    return { streak: last.length, restDayDates };
  }
  // ...or the day before, with yesterday taken as the rest day.
  if (
    isSameLocalDay(last.end, addDays(yesterday, -1)) &&
    canRestOn(yesterday, last, restDays)
  ) {
    return { streak: last.length, restDayDates: [yesterday, ...restDayDates] };
  }
  return { streak: 0, restDayDates: [] };
};

export const getStreakFromActivityLog = (
  reportDates: Array<Date | string | null | undefined>,
  options: StreakFromLogOptions = {},
  now: Date = new Date()
): number => getStreakWalk(reportDates, options, now).streak;

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
  reportDates: Array<Date | string | null | undefined>,
  { restDays = true }: Pick<StreakFromLogOptions, "restDays"> = {}
): number => walkRuns(toPracticedDays(reportDates), restDays).longest;
