import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";

export const getExerciseUserRank = async (
  exerciseId: string,
  score: number
): Promise<number | null> => {
  if (!score) return null;

  const cacheKey = `exerciseRank:${exerciseId}:${score}`;
  const cached = memoryCache.get(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached as number;
  }

  try {
    const col = collection(db, "exerciseLeaderboards", exerciseId, "entries");
    const q = query(col, where("score", ">", score));
    const countSnapshot = await getCountFromServer(q);
    const rank = countSnapshot.data().count + 1;

    memoryCache.set(cacheKey, rank, 10 * 60 * 1000); // 10 minutes cache
    return rank;
  } catch (error) {
    console.error(`Error getting rank for exercise ${exerciseId}:`, error);
    return null;
  }
};
