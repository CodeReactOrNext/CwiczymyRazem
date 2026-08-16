import { updateSeasonalStats } from "feature/report/services/updateSeasonalStats";
import { doc, increment, updateDoc } from "firebase/firestore";
import type { StatisticsDataInterface } from "types/api.types";
import { db } from "utils/firebase/client/firebase.utils";
import type { FameDayState } from "utils/gameLogic/calculateSessionFame";


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
  pointsGained: number,
  seasonId: string,
  fameEarned: number = 0,
  fameDay?: FameDayState
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
    // Denormalized streak state the reminder cron reads instead of re-deriving
    // it from a UTC clock it has no business trusting. Each is written only when
    // present, so a report that carries no timezone leaves the stored one alone.
    ...(statistics.streakDays !== undefined && {
      "statistics.streakDays": statistics.streakDays,
    }),
    ...(statistics.lastPracticeLocalDay && {
      "statistics.lastPracticeLocalDay": statistics.lastPracticeLocalDay,
    }),
    ...(statistics.timeZone && { "statistics.timeZone": statistics.timeZone }),
    ...(statistics.reminderHourUtc !== undefined && {
      "statistics.reminderHourUtc": statistics.reminderHourUtc,
    }),
    "skills": statistics.skills,
    ...(fameEarned > 0 && { "statistics.fame": increment(fameEarned) }),
    ...(fameDay && { "statistics.fameDay": fameDay }),
  };

  await Promise.all([
    updateDoc(userDocRef, updates),
    updateSeasonalStats(userAuth, statistics, sessionTime, pointsGained, seasonId),
  ]);
};