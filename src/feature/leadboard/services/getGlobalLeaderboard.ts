import type { SortByType } from "feature/leadboard/components/LeadboardLayout";
import { logger } from "feature/logger/Logger";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import { firebaseGetUsersExerciseReport } from "utils/firebase/client/firebase.utils";
import { memoryCache } from "utils/cache/memoryCache";

import { getTotalUsersCount } from "./getTotalUsersCount";

interface GlobalLeaderboardResponse {
  users: FirebaseUserDataInterface[];
  totalUsers: number;
  lastVisible?: any;
}

export const getGlobalLeaderboard = async (
  sortBy: SortByType,
  itemsPerPage: number,
  lastVisible?: any
): Promise<GlobalLeaderboardResponse> => {
  try {
    const cacheKey = `leaderboard:${sortBy}:${itemsPerPage}:${lastVisible?.id || 'start'}`;

    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [usersResponse, totalCount] = await Promise.all([
      firebaseGetUsersExerciseReport(sortBy, itemsPerPage, lastVisible),
      getTotalUsersCount(),
    ]);

    const result = {
      users: usersResponse.users,
      totalUsers: totalCount,
      lastVisible: usersResponse.lastVisible,
    };

    memoryCache.set(cacheKey, result, 24 * 60 * 60 * 1000);

    return result;
  } catch (error) {
    logger.error(error, {
      context: "getGlobalLeaderboard",
    });
    throw error;
  }
};

export const invalidateLeaderboardCache = () => {
  memoryCache.clear('leaderboard');
};
