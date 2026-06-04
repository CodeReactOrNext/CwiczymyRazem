/**
 * Returns the user's LOCAL calendar date as a `YYYY-MM-DD` key.
 *
 * Use this instead of `new Date().toISOString().slice(0, 10)` for anything that
 * represents "today" for the user (daily quests, day-bucketing, etc.).
 * `toISOString()` yields the UTC date, which lags/leads the user's local date by
 * the timezone offset — e.g. for users behind UTC the day flips in the afternoon,
 * for users ahead of UTC it doesn't flip until a few hours after local midnight.
 */
export const getLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
