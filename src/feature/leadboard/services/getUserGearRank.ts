import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";

export const getUserGearRank = async (rigLevel: number): Promise<number> => {
  const cacheKey = `userRank:gear:${rigLevel}`;

  const cached = memoryCache.get(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached as number;
  }

  const q = query(collection(db, "users"), where("rigLevel", ">", rigLevel));
  const countSnapshot = await getCountFromServer(q);
  const rank = countSnapshot.data().count + 1;

  memoryCache.set(cacheKey, rank, 5 * 60 * 1000); // 5 minutes cache

  return rank;
};
