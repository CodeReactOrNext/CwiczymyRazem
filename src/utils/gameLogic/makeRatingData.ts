import { HABBITS_POINTS_VALUE, TIME_POINTS_VALUE } from "constants/ratingValue";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import { getDateFromPast } from "utils/converter";

import { getDailyStreakMultiplier } from "./getDailyStreakMultiplier";

export const makeRatingData = (
  data: ReportFormikInterface,
  totalTime: number,
  actualDayWithoutBreak: number,
  // The client's real "now" instant (full timestamp, with time-of-day). Anchoring
  // reportDate to the client clock — the same source as clientTodayISO — keeps the
  // stored date on the user's intended local day regardless of the server's
  // timezone, while preserving the time-of-day so viewer-local rendering (charts,
  // summary) reconverts correctly. Must NOT be UTC-midnight: that would render a
  // day early for users behind UTC.
  now: Date = new Date()
) => {
  const streak = actualDayWithoutBreak;
  const multipler = getDailyStreakMultiplier(streak);
  const habbitsCount = data.habbits.length;
  const additionalPoints = Math.floor(habbitsCount * HABBITS_POINTS_VALUE);
  const timePoints = Math.floor(totalTime * TIME_POINTS_VALUE);
  const totalPoints =
    additionalPoints +
    timePoints +
    Math.floor((additionalPoints + timePoints) * multipler);
  return {
    totalPoints: totalPoints,
    reportDate: data.countBackDays
      ? getDateFromPast(data.countBackDays, now)
      : now,
    bonusPoints: {
      streak: streak,
      multiplier: multipler,
      habitsCount: habbitsCount,
      additionalPoints: additionalPoints,
      time: totalTime,
      timePoints: timePoints,
    },
    ...(data.skillPointsGained ? { skillPointsGained: data.skillPointsGained } : {}),
  };
};
