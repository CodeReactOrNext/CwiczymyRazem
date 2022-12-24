import { convertInputTime } from "pages/api/report/utils/convertInputTime";
import {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";

export const time1Check = (statistics: StatisticsDataInterface) => {
  const { time } = statistics;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  if (totalTime >= 36000000) {
    return "time_1";
  }
};
export const time2Check = (statistics: StatisticsDataInterface) => {
  const { time } = statistics;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  if (totalTime >= 108000000) {
    return "time_2";
  }
};
export const time3Check = (statistics: StatisticsDataInterface) => {
  const { time } = statistics;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  if (totalTime >= 360000000) {
    return "time_3";
  }
};
export const checkBalance = (inputData: ReportFormikInterface) => {
  const { techniqueTime, theoryTime, hearingTime, creativeTime } =
    convertInputTime(inputData);

  if (techniqueTime < 3600000) return;
  if (theoryTime < 3600000) return;
  if (hearingTime < 3600000) return;
  if (creativeTime < 3600000) return;

  return "balance";
};
export const checkFire = (reportData: ReportDataInterface) => {
  if (reportData.basePoints >= 60) return "fire";
};

export const checkHealthHabits = (reportData: ReportDataInterface) => {
  if (reportData.bonusPoints.habitsCount === 5) return "health_habits";
};
