import type { AchievementCheckerReturnType } from "feature/achievements/types";
import type {
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface } from "types/api.types";
import { inputTimeConverter } from "utils/converter";

export const checkTime1 = (statistics: StatisticsDataInterface): AchievementCheckerReturnType => {
  const { time } = statistics;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  if (totalTime >= 36000000) {
    return "time_1";
  }
  
  return undefined;
};

export const checkTime2 = (statistics: StatisticsDataInterface): AchievementCheckerReturnType => {
  const { time } = statistics;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  if (totalTime >= 108000000) {
    return "time_2";
  }
  
  return undefined;
};

export const checkTime3 = (statistics: StatisticsDataInterface): AchievementCheckerReturnType => {
  const { time } = statistics;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  if (totalTime >= 360000000) {
    return "time_3";
  }
  
  return undefined;
};

export const checkTired = (inputData: ReportFormikInterface): AchievementCheckerReturnType => {
  const { techniqueTime, theoryTime, hearingTime, creativityTime } =
    inputTimeConverter(inputData);
  const totalTime = techniqueTime + theoryTime + hearingTime + creativityTime;
  
  if (totalTime >= 18000000) return "tired";
  
  return undefined;
}; 