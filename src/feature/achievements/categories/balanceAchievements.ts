import type { AchievementCheckerReturnType } from "feature/achievements/types";
import type {
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface } from "types/api.types";
import { inputTimeConverter } from "utils/converter";

export const checkBalance = (inputData: ReportFormikInterface) :AchievementCheckerReturnType=> {
  const { techniqueTime, theoryTime, hearingTime, creativityTime } =
    inputTimeConverter(inputData);

  if (techniqueTime < 3600000) return undefined;
  if (theoryTime < 3600000) return undefined;
  if (hearingTime < 3600000) return undefined;
  if (creativityTime < 3600000) return undefined;

  return "balance";
};

export const checkRing = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.time.creativity <= 18000000) return undefined;
  if (statistic.time.technique <= 18000000) return undefined;
  if (statistic.time.theory <= 18000000) return undefined;
  if (statistic.time.hearing <= 18000000) return undefined;
  
  return "ring";
};

export const checkPath = (inputData: ReportFormikInterface): AchievementCheckerReturnType => {
  const { techniqueTime, theoryTime, hearingTime, creativityTime } =
    inputTimeConverter(inputData);

  if (techniqueTime <= 1800000) return undefined;
  if (theoryTime <= 1800000) return undefined;
  if (hearingTime <= 1800000) return undefined;
  if (creativityTime <= 1800000) return undefined;
  if (inputData.habbits.includes("exercise_plan")) return "path";
  
  return undefined;
}; 