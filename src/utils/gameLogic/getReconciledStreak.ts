import { getDisplayStreak } from "./getDisplayStreak";
import { getStreakFromActivityLog } from "./getStreakFromActivityLog";

/** Local calendar-day key (timezone-safe; never serializes through UTC). */
const localDayKey = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const toValidDate = (raw: Date | string | null | undefined): Date | null => {
  if (!raw) return null;
  const date = raw instanceof Date ? raw : new Date(raw);
  return isNaN(date.getTime()) ? null : date;
};

interface ReconciledStreakInput {
  actualDayWithoutBreak: number;
  lastReportDate: string;
  /** Practice instants from the activity log (`report.date`). */
  reportDates: Array<Date | string | null | undefined>;
  /**
   * Set when the caller knows for a fact today was just practiced (e.g. the
   * post-submission summary screen, rendered immediately after a report was
   * sent). The activity log is fetched once and patched locally afterwards, so
   * it can still be missing today's report — without this the log-derived
   * streak silently drops back to whatever it was before the just-submitted
   * session, which only "fixes itself" on a hard page refresh.
   */
  assumePracticedToday?: boolean;
}

export interface ReconciledStreak {
  didPracticeToday: boolean;
  /** Streak value to render (0 when the streak is broken). */
  dayWithoutBreak: number;
}

/**
 * Single source of truth for the streak shown across the UI (header, profile,
 * stats widget).
 *
 * The stored counter (`actualDayWithoutBreak` + `lastReportDate`) is derived from
 * a single mutated date and a past timezone slip can pin it to the wrong calendar
 * day — leaving it permanently too high or too low with no way to tell which.
 * Earlier code took `Math.max(stored, log)` to self-heal a counter that had been
 * reset *down* to 1, but that also lets a counter corrupted *upward* override the
 * correct value, which is exactly the "logs look right but the streak number is
 * wrong" symptom.
 *
 * The activity log records each practice as its real instant and renders it in
 * the viewer's local time, so it is the timezone-correct source of truth and
 * matches exactly what the activity heatmap shows. Once the log is loaded we
 * therefore derive *both* the streak value and "practiced today" purely from it.
 *
 * We deliberately do NOT fold the stored `lastReportDate` back in here: it is a
 * single date serialized as UTC-midnight of the *reporter's* local day, so when
 * viewed from a different timezone it is shifted by the offset and cannot be
 * trusted to say whether "today" was practiced — that mismatch is what made the
 * header read 6 while the local-time activity log (and heatmap) showed 5. When
 * the log has not loaded yet we fall back to the stored counter as the only
 * available signal.
 */
export const getReconciledStreak = (
  {
    actualDayWithoutBreak,
    lastReportDate,
    reportDates,
    assumePracticedToday = false,
  }: ReconciledStreakInput,
  now: Date = new Date()
): ReconciledStreak => {
  const validDates = reportDates
    .map(toValidDate)
    .filter((d): d is Date => d !== null);

  // No activity log yet (still loading): the stored counter is all we have.
  // It is trustworthy here regardless of `assumePracticedToday` — the caller
  // passes that flag right after a submission, and the stored counter was
  // already updated by that very submission (see reportUpdateUserState).
  if (validDates.length === 0) {
    return getDisplayStreak({ actualDayWithoutBreak, lastReportDate }, now);
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = localDayKey(today);
  const didPracticeToday =
    assumePracticedToday || validDates.some((d) => localDayKey(d) === todayKey);

  // The log already contains today's report when present, so the streak walk
  // counts it without any optimistic nudge from the stored state — unless the
  // caller already knows today was just practiced and the log hasn't caught up.
  const dayWithoutBreak = getStreakFromActivityLog(
    validDates,
    { includeToday: assumePracticedToday },
    now
  );

  return { didPracticeToday, dayWithoutBreak };
};
