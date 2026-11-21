const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (ms: number): number => {
  const date = new Date(ms);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
};

/** Whole calendar days between two moments, in the viewer's own time zone. */
const daysAgo = (ms: number, now: number): number =>
  Math.max(0, Math.round((startOfDay(now) - startOfDay(ms)) / DAY_MS));

/**
 * The name of the day a feed entry belongs to: "today" and "yesterday" in the
 * viewer's language, a weekday and date for anything older. The words come from
 * Intl, so they need no translation keys of their own.
 */
export const formatFeedDay = (
  ms: number,
  now: number,
  locale?: string,
): string => {
  const days = daysAgo(ms, now);

  if (days <= 1)
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      -days,
      "day",
    );

  return new Date(ms).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

/**
 * For a feed listed newest first, the heading each entry opens — a day's name
 * on the first entry of that day, `null` on the rest. Today goes unnamed: the
 * top of the feed is today by default, and a heading saying so is only noise.
 * An entry with no timestamp (`null`, e.g. a card pinned out of order) gets no
 * heading and does not break the day running around it.
 */
export const getFeedDayHeadings = (
  timestamps: (number | null)[],
  now: number,
  locale?: string,
): (string | null)[] => {
  let currentDay: number | null = startOfDay(now);

  return timestamps.map((ms) => {
    if (ms === null || Number.isNaN(ms)) return null;

    // A log stamped by a clock running ahead still belongs to today.
    const day = Math.min(startOfDay(ms), startOfDay(now));
    if (day === currentDay) return null;
    currentDay = day;

    return formatFeedDay(ms, now, locale);
  });
};
