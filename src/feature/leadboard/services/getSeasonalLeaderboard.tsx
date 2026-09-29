import type { SortByType } from "feature/leadboard/components/LeadboardLayout";
import { logger } from "feature/logger/Logger";
import {
  collection,
  getCountFromServer,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { memoryCache } from "utils/cache/memoryCache";
import { db } from "utils/firebase/client/firebase.utils";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";

import { mapSeasonalUser } from "./getLeaderboardNeighbors";

export const getSeasonalLeaderboard = async (
  seasonId: string,
  sortBy: SortByType,
  itemsPerPage: number,
  lastVisible?: any
) => {
  try {
    const cacheKey = `seasonal:${seasonId}:${sortBy}:${itemsPerPage}:${lastVisible?.id || 'start'}`;
    
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const seasonalUsersRef = collection(db, "seasons", seasonId, "users");

    const totalSnapshot = await getCountFromServer(seasonalUsersRef);
    const total = totalSnapshot.data().count;

    if (total === 0) {
      logger.error("No users found in season", {
        context: "getSeasonalLeaderboard",
      });
      return { users: [], totalUsers: 0 };
    }

    let q = query(
      seasonalUsersRef,
      orderBy(sortBy, "desc"),
      limit(itemsPerPage)
    );

    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }

    const querySnapshot = await trackedGetDocs(q);

    const users = querySnapshot.docs.map((doc) =>
      mapSeasonalUser(doc.id, doc.data())
    );

    const result = {
      users,
      totalUsers: total,
      lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1],
    };

    memoryCache.set(cacheKey, result, 24 * 60 * 60 * 1000);

    return result;
  } catch (error) {
    throw error;
  }
};
