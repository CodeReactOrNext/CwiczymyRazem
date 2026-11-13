const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Seasons are stored by id ("2026-11") and callers pass "Season 2026-11".
 * Readers think in months, so emails say "November season". Anything that
 * doesn't look like a season id is passed through unchanged.
 */
export function formatSeasonName(seasonName: string): string {
  const match = /^(?:Season\s+)?(\d{4})-(\d{2})$/.exec(seasonName.trim());
  if (!match) return seasonName;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} season` : seasonName;
}
