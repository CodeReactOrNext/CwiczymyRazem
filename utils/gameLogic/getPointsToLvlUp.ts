import { BASE_EXP } from "constants/gameSettings";

export const getPointsToLvlUp = (level: number) => {
  const pointsToLvlUp = (BASE_EXP + level) * level;
  return Math.floor(pointsToLvlUp);
};
