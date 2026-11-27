import type { Locale } from "date-fns";
import { formatDistance } from "date-fns";

/** Younger than this reads as "just now" rather than as a count of seconds. */
const JUST_NOW_MS = 60 * 1000;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** The largest unit that still reads as a whole number of it, as the browser words it per language. */
const formatShortAgo = (elapsed: number, localeCode?: string): string => {
  const [value, unit]: [number, Intl.RelativeTimeFormatUnit] =
    elapsed < HOUR
      ? [Math.floor(elapsed / MINUTE), "minute"]
      : elapsed < DAY
        ? [Math.floor(elapsed / HOUR), "hour"]
        : elapsed < 7 * DAY
          ? [Math.floor(elapsed / DAY), "day"]
          : elapsed < 30 * DAY
            ? [Math.floor(elapsed / (7 * DAY)), "week"]
            : elapsed < 365 * DAY
              ? [Math.floor(elapsed / (30 * DAY)), "month"]
              : [Math.floor(elapsed / (365 * DAY)), "year"];

  return new Intl.RelativeTimeFormat(localeCode ?? "en", {
    style: "short",
  }).format(-value, unit);
};

/**
 * How long ago a feed entry happened. A log stamped by a server whose clock runs slightly ahead of
 * the viewer's would otherwise read "in less than a minute" — the future — so anything in the future
 * or under a minute old is simply "just now".
 */
export const formatLogTime = (
  date: Date,
  now: Date = new Date(),
  {
    locale,
    justNow = "just now",
    short = false,
  }: {
    locale?: Locale;
    justNow?: string;
    /** "2 min. ago" rather than "2 minutes ago": for a line that should stay quiet. */
    short?: boolean;
  } = {},
): string => {
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < JUST_NOW_MS) return justNow;

  if (short) return formatShortAgo(elapsed, locale?.code);

  return formatDistance(date, now, { addSuffix: true, locale });
};
