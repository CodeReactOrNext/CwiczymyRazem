import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";

// Counts only users with the denormalized rigLevel field — docs missing it are
// invisible to orderBy("rigLevel"), so counting them would create phantom pages.
export const getGearUsersCount = async () => {
  // 5-min TTL keeps "out of N" as fresh as the 5-min-cached user rank; the key
  // shares the "leaderboard:gear" prefix so rig mutations clear it too.
  const cacheKey = "leaderboard:gear:count";

  const cached = memoryCache.get(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached as number;
  }

  const q = query(collection(db, "users"), where("rigLevel", ">=", 0));
  const snapshot = await getCountFromServer(q);
  const count = snapshot.data().count;

  memoryCache.set(cacheKey, count, 5 * 60 * 1000);

  return count;
};
