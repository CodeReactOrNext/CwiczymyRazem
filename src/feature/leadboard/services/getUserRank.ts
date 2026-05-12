import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";

export const getUserRank = async (
  userPoints: number,
  seasonId?: string
): Promise<number> => {
  const cacheKey = `userRank:${userPoints}:${seasonId || 'global'}`;

  const cached = memoryCache.get(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached as number;
  }

  const col = seasonId
    ? collection(db, 'seasons', seasonId, 'users')
    : collection(db, 'users');

  const scoreField = seasonId ? 'points' : 'statistics.points';

  const q = query(col, where(scoreField, '>', userPoints));
  const countSnapshot = await getCountFromServer(q);
  const rank = countSnapshot.data().count + 1;

  memoryCache.set(cacheKey, rank, 5 * 60 * 1000); // 5 minutes cache

  return rank;
};
