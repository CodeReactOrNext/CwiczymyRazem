import { getPointsToLvlUp } from "./getPointsToLvlUp";

export const getUserLvl = (lvl: number, points: number) => {
  let level = lvl;
  while (getPointsToLvlUp(level) <= points) {
    level++;
  }
  return level;
};
