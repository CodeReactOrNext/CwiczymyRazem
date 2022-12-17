import { HABBITS_POINTS_VALUE, TIME_POINTS_VALUE } from "constants/ratingValue";
import { ReportInterface } from "../ReportView";
import { getMultiplerValue } from "./getMulitplerValue";

export const makeRatingData = (data: ReportInterface, totalTime: number) => {
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
    currentLevel: 20,
    bonusPoints: {
      streak: +streak,
      multiplier: multipler,
      habitsCount: habbitsCount,
      additionalPoints: additionalPoints,
      time: totalTime,
      timePoints: timePoints,
    },
  };
};
