import { getPointsToLvlUp } from "./getPointsToLvlUp";

export const levelUpUser = (lvl: number, points: number) => {
  let level = lvl;
  while (getPointsToLvlUp(level) <= points) {
    level++;
  }
  return level;
};
