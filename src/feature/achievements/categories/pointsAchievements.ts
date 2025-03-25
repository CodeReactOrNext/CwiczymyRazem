import type { AchievementCheckerReturnType } from "feature/achievements/types";
import type {
  ReportDataInterface,
} from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface } from "types/api.types";

export const checkFire = (reportData: ReportDataInterface) : AchievementCheckerReturnType => {
  if (reportData.totalPoints >= 60) return "fire";
  
  return undefined;
};

export const checkPoints1 = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.points >= 100) return "points_1";
  
  return undefined;
};

export const checkPoints2 = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.points >= 1000) return "points_2";
  
  return undefined;
};

export const checkPoints3 = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.points >= 10000) return "points_3";
  
  return undefined;
};

export const checkShort = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.actualDayWithoutBreak < 10) return undefined;
  if (statistic.points > 15) return undefined   
  
  return "ring";
}; 