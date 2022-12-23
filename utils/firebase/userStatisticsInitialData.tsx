import { AchievementList } from "data/achievements";

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
  points: number;
  sessionCount: number;
  habitsCount: number;
  dayWithoutBreak: number;
  maxPoints: number;
  achievements: AchievementList[];
  actualDayWithoutBreak: number;
  lastReportDate?: string;
}

export const statistics: StatisticsDataInterface = {
  time: {
    technique: 0,
    theory: 0,
    hearing: 0,
    creativity: 0,
    longestSession: 0,
  },
  lvl: 1,
  points: 0,
  sessionCount: 0,
  habitsCount: 0,
  dayWithoutBreak: 0,
  maxPoints: 0,
  achievements: [],
  actualDayWithoutBreak: 0,
};
