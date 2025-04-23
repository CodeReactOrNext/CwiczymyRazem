import type { AchievementCheckerReturnType } from "feature/achievements/types";
import type {
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface } from "types/api.types";
import { inputTimeConverter } from "utils/converter";

export const checkDay1 = (statistic: StatisticsDataInterface) : AchievementCheckerReturnType=> {
  if (statistic.actualDayWithoutBreak >= 3) return "day_1";
  
  return undefined;
};

export const checkDay2 = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.actualDayWithoutBreak >= 7) return "day_2";
  
  return undefined;
};

export const checkDay3 = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.actualDayWithoutBreak >= 15) return "day_3";
  
  return undefined;
};

export const checkSession1 = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.sessionCount >= 20) return "session_1";
  
  return undefined;
};

export const checkSession2 = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.actualDayWithoutBreak >= 50) return "session_2";
  
  return undefined;
};

export const checkSession3 = (statistic: StatisticsDataInterface): AchievementCheckerReturnType => {
  if (statistic.actualDayWithoutBreak >= 100) return "session_3";
  
  return undefined;
};

export const checkDumbbel = (
  inputData: ReportFormikInterface,
  statistic: StatisticsDataInterface
) : AchievementCheckerReturnType=> {
  const { techniqueTime, theoryTime, hearingTime, creativityTime } =
    inputTimeConverter(inputData);
    
  const totalTime = techniqueTime + theoryTime + hearingTime + creativityTime;

  if (totalTime >= 12600000 && statistic.dayWithoutBreak >= 7) return "dumbbel";
  
  return undefined;
}; 

export const checkBomb = (
  inputData: ReportFormikInterface,
  statistic: StatisticsDataInterface
) : AchievementCheckerReturnType=> {
  const { techniqueTime, theoryTime, hearingTime, creativityTime } =
    inputTimeConverter(inputData);
    
  const totalTime = techniqueTime + theoryTime + hearingTime + creativityTime;

  if (totalTime >= 600000 && statistic.dayWithoutBreak >= 15  ) return "bomb";
  
  return undefined;
}; 