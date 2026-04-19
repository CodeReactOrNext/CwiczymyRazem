import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

const getActivityLogsCacheKey = (userAuth: string, year: number) =>
  `activityLogs:${userAuth}:${year}`;

export const invalidateActivityLogsCache = (userAuth: string, year?: number) => {
  if (year) {
    memoryCache.invalidate(getActivityLogsCacheKey(userAuth, year));
  } else {
    memoryCache.clear(`activityLogs:${userAuth}`);
  }
};

export const firebaseGetUserRaprotsLogs = async (
  userAuth: string,
  year?: number | "all"
) => {
  const isAllTime = year === "all";
  const targetYear = !isAllTime ? (year ?? new Date().getFullYear()) : null;
  const cacheKey = isAllTime 
    ? `activityLogs:${userAuth}:all` 
    : getActivityLogsCacheKey(userAuth, targetYear!);

  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached as FirebaseUserExceriseLog[];
  }

  const userDocRef = doc(db, "users", userAuth);
  const exerciseDataRef = collection(userDocRef, "exerciseData");

  let reportsQuery;
  if (isAllTime) {
    // Fetch all logs without filtering by year
    reportsQuery = query(exerciseDataRef);
  } else {
    const startOfYear = new Date(targetYear!, 0, 1).toISOString();
    const endOfYear = new Date(targetYear!, 11, 31, 23, 59, 59, 999).toISOString();

    reportsQuery = query(
      exerciseDataRef,
      where("__name__", ">=", startOfYear),
      where("__name__", "<=", endOfYear)
    );
  }

  const exerciseDocRef = await getDocs(reportsQuery);

  const exerciseArr: FirebaseUserExceriseLog[] = [];

  exerciseDocRef.forEach((exercise) => {
    const log = exercise.data() as FirebaseUserExceriseLog;
    exerciseArr.push(log);
  });

  memoryCache.set(cacheKey, exerciseArr, TWO_DAYS_MS);

  return exerciseArr;
};
