import { calcExperience } from "helpers/calcExperience";

export const getUserLvl = (lvl: number, points: number) => {
  let level = lvl;
  while (calcExperience(level) < points) {
    level++;
  }
  return level;
};
