import { HABBITS_POINTS_VALUE, TIME_POINTS_VALUE } from "constants/ratingValue";
import { ReportFormikInterface } from "../ReportView.types";
import { getMultiplerValue } from "./getMulitplerValue";

export const makeRatingData = (
  data: ReportFormikInterface,
  totalTime: number
) => {
  const streak = 5;
  const multipler = getMultiplerValue(streak);
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
