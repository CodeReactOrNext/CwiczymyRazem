import { BASE_EXP } from "constants/gameSettings";

export const calcExperience = (level: number) => {
  const expperience = (BASE_EXP + level) * level;
  return Math.floor(expperience);
};
