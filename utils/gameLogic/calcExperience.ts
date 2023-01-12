import { BASE_EXP, LEVER_FACTOR } from "constants/gameSettings";

export const calcExperience = (currentLevel: number) => {
  const expperience =
    BASE_EXP + currentLevel * (currentLevel - 1) * LEVER_FACTOR;
  return Math.floor(expperience);
};
