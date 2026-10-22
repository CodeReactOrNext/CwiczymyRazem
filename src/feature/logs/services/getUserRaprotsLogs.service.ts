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

// Reads already on the wire, by cache key. The dashboard mounts the header
// streak, the activity calendar and the milestone dot together, and the memory
// cache only answers once a read has finished — each of them used to start its
// own download of the same collection.
const inFlight = new Map<string, Promise<FirebaseUserExceriseLog[]>>();

export const invalidateActivityLogsCache = (userAuth: string, year?: number) => {
  if (year) {
    memoryCache.invalidate(getActivityLogsCacheKey(userAuth, year));
  } else {
    memoryCache.clear(`activityLogs:${userAuth}`);
  }
  for (const key of inFlight.keys()) {
    if (key.startsWith(`activityLogs:${userAuth}:`)) inFlight.delete(key);
  }
};

/** Document ids are ISO timestamps, so a year is a plain range over them. */
const filterYear = (logs: FirebaseUserExceriseLog[], year: number) => {
  const startOfYear = new Date(year, 0, 1).toISOString();
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();
  return logs.filter(
    (log) => !!log.id && log.id >= startOfYear && log.id <= endOfYear,
  );
};

const getLogsCacheKey = (userAuth: string, year?: number | "all") =>
  year === "all"
    ? `activityLogs:${userAuth}:all`
    : getActivityLogsCacheKey(userAuth, year ?? new Date().getFullYear());

/**
 * The logs `firebaseGetUserRaprotsLogs` already holds in memory, read synchronously —
 * lets a view that mounts again render them on its first frame instead of flashing
 * a loading state while the (instant) cached promise resolves.
 */
export const peekUserRaprotsLogs = (
  userAuth: string,
  year?: number | "all",
): FirebaseUserExceriseLog[] | null => {
  const cached = memoryCache.get(getLogsCacheKey(userAuth, year)) as
    | FirebaseUserExceriseLog[]
    | null;
  if (cached || year === "all") return cached;

  const allTime = memoryCache.get(getLogsCacheKey(userAuth, "all")) as
    | FirebaseUserExceriseLog[]
    | null;
  return allTime ? filterYear(allTime, year ?? new Date().getFullYear()) : null;
};

const fetchLogs = async (
  userAuth: string,
  isAllTime: boolean,
  targetYear: number | null,
  cacheKey: string,
) => {
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
    exerciseArr.push({ ...log, id: exercise.id });
  });

  memoryCache.set(cacheKey, exerciseArr, TWO_DAYS_MS);

  return exerciseArr;
};

export const firebaseGetUserRaprotsLogs = async (
  userAuth: string,
  year?: number | "all"
) => {
  const isAllTime = year === "all";
  const targetYear = !isAllTime ? (year ?? new Date().getFullYear()) : null;
  const cacheKey = getLogsCacheKey(userAuth, year);

  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached as FirebaseUserExceriseLog[];
  }

  const pending = inFlight.get(cacheKey);
  if (pending) return pending;

  // One year is a slice of the full history: if that is loaded or loading,
  // there is nothing left to download.
  if (!isAllTime) {
    const allTimeKey = getLogsCacheKey(userAuth, "all");
    const allTime =
      (memoryCache.get(allTimeKey) as FirebaseUserExceriseLog[] | null) ??
      inFlight.get(allTimeKey);
    if (allTime) {
      return Promise.resolve(allTime).then((logs) => filterYear(logs, targetYear!));
    }
  }

  const request = fetchLogs(userAuth, isAllTime, targetYear, cacheKey);
  inFlight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    // Only our own entry: an invalidation may have dropped it, and a newer
    // read may already sit under the same key.
    if (inFlight.get(cacheKey) === request) inFlight.delete(cacheKey);
  }
};
