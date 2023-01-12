
import { HABBITS_POINTS_VALUE, TIME_POINTS_VALUE } from "constants/ratingValue";
import { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import { getDailyStreakMultiplier } from "./getDailyStreakMultiplier";

export const makeRatingData = (
  data: ReportFormikInterface,
  totalTime: number,
  actualDayWithoutBreak: number
) => {
  const streak = actualDayWithoutBreak;
  const multipler = getDailyStreakMultiplier(streak);
  const habbitsCount = data.habbits.length;
  const additionalPoints = Math.floor(habbitsCount * HABBITS_POINTS_VALUE);
  const timePoints = Math.floor(totalTime * TIME_POINTS_VALUE);
  const basePoints =
    additionalPoints +
    timePoints +
    Math.floor((additionalPoints + timePoints) * multipler);
  return {
    basePoints: basePoints,
    reportDate: new Date(),
    bonusPoints: {
      streak: streak,
      multiplier: multipler,
      habitsCount: habbitsCount,
      additionalPoints: additionalPoints,
      time: totalTime,
      timePoints: timePoints,
    },
  };
};
