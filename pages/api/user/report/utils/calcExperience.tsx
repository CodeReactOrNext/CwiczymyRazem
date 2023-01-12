import { BASE_EXP, LEVEL_FACTOR } from "constants/gameSettings";

export const calcExperience = (level: number) => {
  const expperience = (BASE_EXP + level) * level;
  return Math.floor(expperience);
};
