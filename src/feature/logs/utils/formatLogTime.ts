import { formatDistance } from "date-fns";

/** Younger than this reads as "just now" rather than as a count of seconds. */
const JUST_NOW_MS = 60 * 1000;

/**
 * How long ago a feed entry happened. A log stamped by a server whose clock runs slightly ahead of
 * the viewer's would otherwise read "in less than a minute" — the future — so anything in the future
 * or under a minute old is simply "just now".
 */
export const formatLogTime = (date: Date, now: Date = new Date()): string => {
  if (now.getTime() - date.getTime() < JUST_NOW_MS) return "just now";

  return formatDistance(date, now, { addSuffix: true });
};
