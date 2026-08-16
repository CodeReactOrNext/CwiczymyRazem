/**
 * Local wall-clock hour the "streak at risk" email aims for. Late enough that a
 * reminder is actionable (the evening is still free) but early enough to leave
 * room for a session before the local day rolls over.
 */
export const STREAK_REMINDER_LOCAL_HOUR = 19;

/**
 * Bucket used for accounts we cannot place in a timezone yet — either they have
 * not reported since per-user scheduling shipped, or their browser reported an
 * unusable zone. It is also the hour the once-a-day cron blocks (push, season
 * emails, the legacy full user scan) run on, so those accounts keep the exact
 * behaviour they had before the hourly cron.
 */
export const DEFAULT_REMINDER_HOUR_UTC = 10;
