import { DEFAULT_REMINDER_HOUR_UTC } from "constants/streakReminder";

/**
 * Timezone-aware calendar helpers shared by the report write path (runs in the
 * user's browser) and the reminder cron (runs on a UTC server).
 *
 * Streak state has historically drifted because each side re-derived "which day
 * is it for this user" from a different clock — `new Date()` on a UTC server is
 * a different calendar day than the user's wall clock for part of every day.
 * These helpers take the user's IANA zone explicitly so both sides can agree on
 * one answer, and degrade to the host's local calendar when no zone is known.
 */

const pad = (value: number): string => String(value).padStart(2, "0");

export const isValidTimeZone = (
  timeZone: string | null | undefined
): timeZone is string => {
  if (typeof timeZone !== "string" || !timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
};

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** The instant broken into wall-clock fields as seen inside `timeZone`. */
const getZonedParts = (date: Date, timeZone: string): ZonedParts => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    // `hourCycle` rather than `hour12: false`, which can render midnight as "24".
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
  };
};

/**
 * The calendar day the instant falls on, as `YYYY-MM-DD`.
 *
 * A plain string is deliberate: it survives a Firestore round trip and a JSON
 * hop without ever being re-interpreted against a timezone, which is exactly the
 * failure mode that lets a stored `Date` land on the neighbouring day.
 */
export const getLocalDayKey = (
  date: Date,
  timeZone?: string | null
): string => {
  if (isValidTimeZone(timeZone)) {
    const { year, month, day } = getZonedParts(date, timeZone);
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

/** Midnight UTC of a `YYYY-MM-DD` key, or null when the key is malformed. */
export const dayKeyToUtcMs = (dayKey: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return null;
  const ms = Date.parse(`${dayKey}T00:00:00Z`);
  return Number.isNaN(ms) ? null : ms;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole calendar days from `fromDayKey` to `toDayKey`. Both keys are anchored to
 * UTC midnight purely as a counting device — they already carry the user's local
 * day, so no offset is involved and DST cannot shift the result.
 */
export const daysBetweenDayKeys = (
  fromDayKey: string,
  toDayKey: string
): number | null => {
  const from = dayKeyToUtcMs(fromDayKey);
  const to = dayKeyToUtcMs(toDayKey);
  if (from === null || to === null) return null;
  return Math.round((to - from) / DAY_MS);
};

/** Minutes `timeZone` is ahead of UTC at that instant (negative when behind). */
const getTimeZoneOffsetMinutes = (date: Date, timeZone: string): number => {
  const { year, month, day, hour, minute } = getZonedParts(date, timeZone);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  // The parts carry no seconds, so the instant is truncated the same way —
  // otherwise the difference is off by up to a minute.
  const truncatedInstant = Math.floor(date.getTime() / 60000) * 60000;

  return (wallClockAsUtc - truncatedInstant) / 60000;
};

/**
 * The UTC hour at which it is `localHour` in `timeZone` — the bucket the hourly
 * reminder cron queries on, so a user is only ever considered on the one run
 * that matches their evening.
 *
 * Recomputed on every report, which is what keeps it right across DST: at worst
 * one reminder lands an hour off, on the first day after a clock change and
 * before the user's next session.
 *
 * Zones on a half/quarter-hour offset round to the nearest hour, so their
 * reminder lands up to 30 minutes either side of `localHour`.
 */
export const getReminderHourUtc = (
  timeZone: string | null | undefined,
  localHour: number,
  now: Date = new Date()
): number => {
  if (!isValidTimeZone(timeZone)) return DEFAULT_REMINDER_HOUR_UTC;

  const utcMinutes = localHour * 60 - getTimeZoneOffsetMinutes(now, timeZone);
  const hour = Math.round(utcMinutes / 60);

  return ((hour % 24) + 24) % 24;
};

/**
 * Whole hours left before the user's local day rolls over — the deadline a
 * streak actually dies at. Null when the zone is unknown, so callers can fall
 * back to vaguer copy instead of quoting a number computed from the wrong clock.
 */
export const getHoursUntilLocalMidnight = (
  now: Date,
  timeZone: string | null | undefined
): number | null => {
  if (!isValidTimeZone(timeZone)) return null;

  const { hour, minute } = getZonedParts(now, timeZone);
  const minutesLeft = 24 * 60 - (hour * 60 + minute);

  // Floored, never rounded up: promising more time than there is turns a
  // reminder into a broken promise. Clamped to 1 so the copy cannot read
  // "0 hours left" in the final minutes before midnight.
  return Math.max(1, Math.floor(minutesLeft / 60));
};
