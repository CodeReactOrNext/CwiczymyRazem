
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";

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
