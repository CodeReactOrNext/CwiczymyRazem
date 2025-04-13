import type { AchievementCheckerReturnType } from "feature/achievements/types";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface } from "types/api.types";
import { inputTimeConverter } from "utils/converter";

export const checkDiamond = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.lvl >= 28) return "diamond";
  
  return undefined;
};

export const checkLvl100 = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.lvl >= 100) return "lvl100";
  
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

export const checkFireSession = (inputData: ReportFormikInterface): AchievementCheckerReturnType => {

 const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(inputData)
 const isTitleExist = inputData.reportTitle
 const isAllHabbits = inputData.habbits.length >= 5

 const isEveryCategoryTime = techniqueTime && theoryTime && hearingTime && creativityTime
 

  if (isEveryCategoryTime && isTitleExist && isAllHabbits) return "fireSession";
  
  return undefined;
};




