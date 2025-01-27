import { getCurrentSeason } from "feature/leadboard/services/getCurrentSeason";
import {  doc, getDoc, setDoc } from "firebase/firestore";
import type { StatisticsDataInterface } from "types/api.types";
import { db } from "utils/firebase/client/firebase.utils";

export const updateSeasonalStats = async (
  userId: string,
  stats: StatisticsDataInterface,
  sessionTime: {
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
    sumTime: number;
  },
  pointsGained: number
) => {
  const season = await getCurrentSeason();
  const userSeasonRef = doc(db, "seasons", season.seasonId, "users", userId);
  const userSeasonDoc = await getDoc(userSeasonRef);

  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();

  const currentSeasonData = userSeasonDoc.exists()
    ? userSeasonDoc.data()
    : {
        points: 0,
        sessionCount: 0,
        time: {
          creativity: 0,
          hearing: 0,
          technique: 0,
          theory: 0,
          longestSession: 0,
        },
        achievements: [],
      };

  const updatedSeasonData = {
    ...currentSeasonData,
    points: (currentSeasonData.points || 0) + pointsGained,
    sessionCount: (currentSeasonData.sessionCount || 0) + 1,
    time: {
      creativity:
        (currentSeasonData.time?.creativity || 0) +
        (sessionTime.creativityTime || 0),
      hearing:
        (currentSeasonData.time?.hearing || 0) + (sessionTime.hearingTime || 0),
      technique:
        (currentSeasonData.time?.technique || 0) +
        (sessionTime.techniqueTime || 0),
      theory:
        (currentSeasonData.time?.theory || 0) + (sessionTime.theoryTime || 0),
      longestSession: Math.max(
        currentSeasonData.time?.longestSession || 0,
        sessionTime.sumTime || 0
      ),
    },
    achievements: stats.achievements || [],
    lvl: stats.lvl || 1,
    lastReportDate: stats.lastReportDate || new Date().toISOString(),
    displayName: userData?.displayName || "Unknown User",
    avatar: userData?.avatar || "",
    seasonId: season.seasonId,
  };

  await setDoc(userSeasonRef, updatedSeasonData, { merge: true });
};

