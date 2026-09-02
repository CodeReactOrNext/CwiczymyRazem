/**
 * Returns the shared *server* calendar date as a `YYYY-MM-DD` key, in UTC.
 *
 * The counterpart to `getLocalDateKey`, and the one to reach for whenever a day
 * has to mean the same thing for every player at once: daily quests, the daily
 * Fame allowance, the trader's stock, the weekly and monthly boards. Those are
 * things players chase together or are ranked against each other on, and a day
 * that starts at a different instant for each participant makes any shared
 * deadline unstateable — a goal closing "tonight" would already be closed for
 * half the players and still open for the other half.
 *
 * Use `getLocalDateKey` instead for anything that is only ever about one
 * player's own habit — the practice streak above all, where a fixed UTC day
 * would end mid-afternoon in the Americas and split a perfectly regular evening
 * routine across two days.
 */
export const getServerDateKey = (date: Date = new Date()): string =>
  date.toISOString().slice(0, 10);
