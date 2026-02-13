import { updateSeasonalStats } from "feature/report/services/updateSeasonalStats";
import { doc, updateDoc } from "firebase/firestore";
import type { StatisticsDataInterface } from "types/api.types";
import { db } from "utils/firebase/client/firebase.utils";


export const firebaseUpdateUserStats = async (
  userAuth: string,
  statistics: StatisticsDataInterface,
  sessionTime: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  },
  pointsGained: number
) => {
  const userDocRef = doc(db, "users", userAuth);

  // Use dot-notation to update only report-related fields.
  // This prevents overwriting skills and other fields that may be 
  // concurrently modified.
  const updates: Record<string, any> = {
    "statistics.time": statistics.time,
    "statistics.lvl": statistics.lvl,
    "statistics.currentLevelMaxPoints": statistics.currentLevelMaxPoints,
    "statistics.points": statistics.points,
    "statistics.sessionCount": statistics.sessionCount,
    "statistics.habitsCount": statistics.habitsCount,
    "statistics.dayWithoutBreak": statistics.dayWithoutBreak,
    "statistics.maxPoints": statistics.maxPoints,
    "statistics.actualDayWithoutBreak": statistics.actualDayWithoutBreak,
    "statistics.achievements": statistics.achievements,
    "statistics.lastReportDate": statistics.lastReportDate,
    "skills": statistics.skills,
  };

  await Promise.all([
    updateDoc(userDocRef, updates),
    updateSeasonalStats(userAuth, statistics, sessionTime, pointsGained),
  ]);
};