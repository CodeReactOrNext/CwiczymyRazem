import type { AchievementCheckerReturnType } from "feature/achievements/types";
import type { StatisticsDataInterface } from "types/api.types";

export const checkDiamond = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.lvl >= 28) return "diamond";
  
  return undefined;
};

export const checkScientist = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.time.theory >= 180000000) return "scientist";
  
  return undefined;
};

export const checkBigear = (statistic: StatisticsDataInterface) : AchievementCheckerReturnType=> {
  if (statistic.time.hearing >= 180000000) return "bigear";
  
  return undefined;
};

export const checkWizard = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.time.creativity >= 180000000) return "wizard";
  
  return undefined;
};

export const checkBook = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.time.theory >= 36000000) return "book";
  
  return undefined;
};

export const checkArtist = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.time.creativity >= 36000000) return "artist";
  
  return undefined;
};

export const checkHeadphones = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.time.hearing >= 36000000) return "headphones";
  
  return undefined;
};

export const checkNinja = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.time.technique >= 36000000) return "ninja";
  
  return undefined;
};

export const checkMedal = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.achievements.length >= 20) return "medal";
  
  return undefined;
}; 