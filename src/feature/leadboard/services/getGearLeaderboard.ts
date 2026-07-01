import { logger } from "feature/logger/Logger";
import {
  collection,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

import { getGearUsersCount } from "./getGearUsersCount";

interface GearLeaderboardResponse {
  users: FirebaseUserDataInterface[];
  totalUsers: number;
  lastVisible?: any;
}

export const getGearLeaderboard = async (
  itemsPerPage: number,
  lastVisible?: any
): Promise<GearLeaderboardResponse> => {
  try {
    const cacheKey = `leaderboard:gear:${itemsPerPage}:${lastVisible?.id || 'start'}`;

    // The page rows are cached for 24h, but the total is resolved on every call
    // (through its own 5-min cache) so "out of N" stays as fresh as the user rank.
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return { ...cached, totalUsers: await getGearUsersCount() };
    }

    let q = query(
      collection(db, "users"),
      orderBy("rigLevel", "desc"),
      limit(itemsPerPage)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const [querySnapshot, totalUsers] = await Promise.all([
      trackedGetDocs(q),
      getGearUsersCount(),
    ]);

    const users = querySnapshot.docs.map((doc: any) => ({
      profileId: doc.id,
      ...doc.data(),
    })) as FirebaseUserDataInterface[];

    const page = {
      users,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1],
    };

    memoryCache.set(cacheKey, page, 24 * 60 * 60 * 1000);

    return { ...page, totalUsers };
  } catch (error) {
    logger.error(error, {
      context: "getGearLeaderboard",
    });
    throw error;
  }
};
