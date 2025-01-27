import { updateSeasonalStats } from "feature/report/services/updateSeasonalStats";
import {  doc, updateDoc } from "firebase/firestore";
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
  await Promise.all([
    updateDoc(userDocRef, { statistics }),
    updateSeasonalStats(userAuth, statistics, sessionTime, pointsGained),
  ]);
};