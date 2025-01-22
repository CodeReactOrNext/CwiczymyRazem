import type {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import type { StatisticsDataInterface } from "types/api.types";
import { inputTimeConverter } from "utils/converter";

export const time1Check = (statistics: StatisticsDataInterface) => {
  const { time } = statistics;
  const totalTime =
    time.technique + time.theory + time.hearing + time.creativity;

  if (totalTime >= 36000000) {
    return "time_1";
  }
  
  return undefined;
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
  const { techniqueTime, theoryTime, hearingTime, creativityTime } =
    inputTimeConverter(inputData);

  if (techniqueTime < 3600000) return;
  if (theoryTime < 3600000) return;
  if (hearingTime < 3600000) return;
  if (creativityTime < 3600000) return;

  return "balance";
};
export const checkFire = (reportData: ReportDataInterface) => {
  if (reportData.totalPoints >= 60) return "fire";
};

export const checkHealthHabits = (reportData: ReportDataInterface) => {
  if (reportData.bonusPoints.habitsCount === 5) return "health_habits";
};

export const checkPoints1 = (statistic: StatisticsDataInterface) => {
  if (statistic.points >= 100) return "points_1";
};
export const checkPoints2 = (statistic: StatisticsDataInterface) => {
  if (statistic.points >= 1000) return "points_2";
};
export const checkPoints3 = (statistic: StatisticsDataInterface) => {
  if (statistic.points >= 10000) return "points_3";
};

export const checkDoctor = (statistic: StatisticsDataInterface) => {
  if (statistic.habitsCount >= 100) return "doctor";
};

export const checkTired = (inputData: ReportFormikInterface) => {
  const { techniqueTime, theoryTime, hearingTime, creativityTime } =
    inputTimeConverter(inputData);
  const totalTime = techniqueTime + theoryTime + hearingTime + creativityTime;
  if (totalTime >= 18000000) return "tired";
};

export const checkDiamond = (statistic: StatisticsDataInterface) => {
  if (statistic.lvl >= 28) return "diamond";
};
export const checksScientist = (statistic: StatisticsDataInterface) => {
  if (statistic.time.theory >= 180000000) return "scientist";
};
export const checksBigear = (statistic: StatisticsDataInterface) => {
  if (statistic.time.hearing >= 180000000) return "bigear";
};
export const checksWizard = (statistic: StatisticsDataInterface) => {
  if (statistic.time.creativity >= 180000000) return "wizard";
};
export const checksBook = (statistic: StatisticsDataInterface) => {
  if (statistic.time.theory >= 36000000) return "book";
};
export const checkArtist = (statistic: StatisticsDataInterface) => {
  if (statistic.time.creativity >= 36000000) return "artist";
};
export const checkMedal = (statistic: StatisticsDataInterface) => {
  if (statistic.achievements.length >= 20) return "medal";
};
export const checkDay1 = (statistic: StatisticsDataInterface) => {
  if (statistic.actualDayWithoutBreak >= 3) return "day_1";
};
export const checkDay2 = (statistic: StatisticsDataInterface) => {
  if (statistic.actualDayWithoutBreak >= 7) return "day_2";
};
export const checkDay3 = (statistic: StatisticsDataInterface) => {
  if (statistic.actualDayWithoutBreak >= 15) return "day_3";
};

export const checkSession1 = (statistic: StatisticsDataInterface) => {
  if (statistic.sessionCount >= 20) return "session_1";
};

export const checkSession2 = (statistic: StatisticsDataInterface) => {
  if (statistic.actualDayWithoutBreak >= 50) return "session_2";
};

export const checkSession3 = (statistic: StatisticsDataInterface) => {
  if (statistic.actualDayWithoutBreak >= 100) return "session_3";
};
export const checkRing = (statistic: StatisticsDataInterface) => {
  if (statistic.time.creativity <= 18000000) return;
  if (statistic.time.technique <= 18000000) return;
  if (statistic.time.theory <= 18000000) return;
  if (statistic.time.hearing <= 18000000) return;
  return "ring";
};
export const checkShort = (statistic: StatisticsDataInterface) => {
  if (statistic.actualDayWithoutBreak < 10) return;
  if (statistic.points > 15) return;
  return "ring";
};
export const checkHeadphones = (statistic: StatisticsDataInterface) => {
  if (statistic.time.hearing <= 36000000) return;
  return "headphones";
};
export const checkNinja = (statistic: StatisticsDataInterface) => {
  if (statistic.time.theory <= 36000000) return;
  return "ninja";
};
export const checkRecord = (inputData: ReportFormikInterface) => {
  const { techniqueTime } = inputTimeConverter(inputData);
  if (
    inputData.habbits.includes("recording") &&
    inputData.habbits.includes("metronome") &&
    techniqueTime >= 10800000
  )
    return "record";
};
export const checkVinyl = (inputData: ReportFormikInterface) => {
  const { creativityTime } = inputTimeConverter(inputData);
  if (inputData.habbits.includes("recording") && creativityTime >= 10800000)
    return "vinyl";
};
export const checkRightway = (inputData: ReportFormikInterface) => {
  const { techniqueTime } = inputTimeConverter(inputData);
  if (inputData.habbits.includes("warmup") && techniqueTime >= 10800000)
    return "rightway";
};

export const checkYolo = (inputData: ReportFormikInterface) => {
  const { techniqueTime, theoryTime, hearingTime, creativityTime } =
    inputTimeConverter(inputData);
  const totalTime = techniqueTime + theoryTime + hearingTime + creativityTime;
  if (totalTime >= 10800000 && inputData.habbits.length === 0) return "yolo";
};

export const checkPath = (inputData: ReportFormikInterface) => {
  const { techniqueTime, theoryTime, hearingTime, creativityTime } =
    inputTimeConverter(inputData);

  if (techniqueTime <= 1800000) return;
  if (theoryTime <= 1800000) return;
  if (hearingTime <= 1800000) return;
  if (creativityTime <= 1800000) return;
  if (inputData.habbits.includes("exercise_plan")) return "path";
};

export const checkDumbbel = (
  inputData: ReportFormikInterface,
  statistic: StatisticsDataInterface
) => {
  const { techniqueTime, theoryTime, hearingTime, creativityTime } =
    inputTimeConverter(inputData);
  const totalTime = techniqueTime + theoryTime + hearingTime + creativityTime;

  if (totalTime >= 12600000 && statistic.dayWithoutBreak >= 7) return "dumbbel";
};
