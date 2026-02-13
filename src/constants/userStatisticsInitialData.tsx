import { Timestamp } from "firebase/firestore";
import type { StatisticsDataInterface } from "types/api.types";

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
  currentLevelMaxPoints: 35,
  sessionCount: 0,
  habitsCount: 0,
  dayWithoutBreak: 0,
  maxPoints: 0,
  achievements: [],
  actualDayWithoutBreak: 0,
  lastReportDate: "",
  songLists: {
    wantToLearn: [],
    learned: [],
    learning: [],
  },
  guitarStartDate: Timestamp.now(),
  fame: 0,
};
