import { achievementList } from "assets/achievements/achievementsData";

export interface StatisticsTime {
  technique: number;
  theory: number;
  hearing: number;
  creativity: number;
  longestSession: number;
}

export interface StatisticsDataInterface {
  time: StatisticsTime;
  lvl: number;
  pointsToNextLvl: number;
  points: number;
  sessionCount: number;
  habitsCount: number;
  dayWithoutBreak: number;
  maxPoints: number;
  achievements: achievementList[];
  actualDayWithoutBreak: number;
  lastReportDate: string;
}

export const statisticsInitial: StatisticsDataInterface = {
  time: {
    technique: 0,
    theory: 0,
    hearing: 0,
    creativity: 0,
    longestSession: 0,
  },
  lvl: 1,
  points: 0,
  pointsToNextLvl: 35,
  sessionCount: 0,
  habitsCount: 0,
  dayWithoutBreak: 0,
  maxPoints: 0,
  achievements: [],
  actualDayWithoutBreak: 0,
  lastReportDate: "",
};
