import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { memoryCache } from "utils/cache/memoryCache";

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
  year?: number
) => {
  const targetYear = year ?? new Date().getFullYear();
  const cacheKey = getActivityLogsCacheKey(userAuth, targetYear);

  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached as FirebaseUserExceriseLog[];
  }

  const userDocRef = doc(db, "users", userAuth);
  const exerciseDataRef = collection(userDocRef, "exerciseData");

  const startOfYear = new Date(targetYear, 0, 1).toISOString();
  const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999).toISOString();

  const yearQuery = query(
    exerciseDataRef,
    where("__name__", ">=", startOfYear),
    where("__name__", "<=", endOfYear)
  );

  const exerciseDocRef = await getDocs(yearQuery);

  const exerciseArr: FirebaseUserExceriseLog[] = [];

  exerciseDocRef.forEach((exercise) => {
    const log = exercise.data() as FirebaseUserExceriseLog;
    exerciseArr.push(log);
  });

  memoryCache.set(cacheKey, exerciseArr, TWO_DAYS_MS);

  return exerciseArr;
};
