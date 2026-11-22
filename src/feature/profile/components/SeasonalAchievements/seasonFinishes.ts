import type { SeasonalAchievement } from "feature/profile/services/seasonalAchievementsService";

/**
 * "2026-10" as the reader says it: "October 2026", "październik 2026". Any id
 * that is not a year and a month comes back untouched rather than as a date
 * someone made up.
 *
 * Built at noon UTC on the 15th and formatted in UTC, so no time zone can push
 * it into the month next door.
 */
export const formatSeasonMonth = (
  seasonId: string,
  locale?: string,
): string => {
  const match = /^(\d{4})-(\d{1,2})$/.exec(seasonId);
  if (!match) return seasonId;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return seasonId;

  return new Intl.DateTimeFormat(locale ?? "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 15, 12)));
};

export interface SeasonFinishesSummary {
  /** The highest place ever reached, or null with no finishes at all. */
  bestPlace: number | null;
  /** How many seasons ended in the paid top 10. */
  topTenCount: number;
}

/** The one line under the section's title: best place, and how often top 10. */
export const summarizeSeasonFinishes = (
  finishes: Pick<SeasonalAchievement, "place">[],
): SeasonFinishesSummary => ({
  bestPlace: finishes.length
    ? Math.min(...finishes.map((finish) => finish.place))
    : null,
  topTenCount: finishes.filter((finish) => finish.place <= 10).length,
});
