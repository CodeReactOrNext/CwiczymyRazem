import { ReportInterface } from "feature/user/view/ReportView/ReportView";

export interface statisticsDataInterface {
  time: {
    technique: number;
    theory: number;
    hearing: number;
    creativity: number;
    longestSession: number;
  };
  lvl: number;
  points: number;
  sessionCount: number;
  habitsCount: number;
  dayWithoutBreak: number;
  maxPoints: number;
  achievements: string[];
  actualdayWithoutBreak: number;
  lastReport?: ReportInterface;
}

export const statistics: statisticsDataInterface = {
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
  actualdayWithoutBreak: 0,
};
