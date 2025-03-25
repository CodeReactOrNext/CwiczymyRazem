import type { AchievementCheckerReturnType } from "feature/achievements/types";
import type {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface } from "types/api.types";
import { inputTimeConverter } from "utils/converter";

export const checkHealthHabits = (reportData: ReportDataInterface): AchievementCheckerReturnType  => {
  if (reportData.bonusPoints.habitsCount === 5) return "health_habits";
  
  return undefined;
};

export const checkDoctor = (statistic: StatisticsDataInterface) => {
  if (statistic.habitsCount >= 100) return "doctor";
  
  return undefined;
};

export const checkRecord = (inputData: ReportFormikInterface): AchievementCheckerReturnType => {
  const { techniqueTime } = inputTimeConverter(inputData);
  if (
    inputData.habbits.includes("recording") &&
    inputData.habbits.includes("metronome") &&
    techniqueTime >= 10800000
  )
    return "record";
  
  return undefined;
};

export const checkVinyl = (inputData: ReportFormikInterface) : AchievementCheckerReturnType=> {
  const { creativityTime } = inputTimeConverter(inputData);
  if (inputData.habbits.includes("recording") && creativityTime >= 10800000)
    return "vinyl";
  
  return undefined;
};

export const checkRightway = (inputData: ReportFormikInterface): AchievementCheckerReturnType => {
  const { techniqueTime } = inputTimeConverter(inputData);
  if (inputData.habbits.includes("warmup") && techniqueTime >= 10800000)
    return "rightway";
  
  return undefined;
};

export const checkYolo = (inputData: ReportFormikInterface) : AchievementCheckerReturnType=> {
  const { techniqueTime, theoryTime, hearingTime, creativityTime } =
    inputTimeConverter(inputData);
  const totalTime = techniqueTime + theoryTime + hearingTime + creativityTime;
  if (totalTime >= 10800000 && inputData.habbits.length === 0) return "yolo";
  
  return undefined;
}; 