import type { SortByType } from "feature/leadboard/components/LeadboardLayout";
import { logger } from "feature/logger/Logger";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import { firebaseGetUsersExceriseRaport } from "utils/firebase/client/firebase.utils";
import { memoryCache } from "utils/cache/memoryCache";

import { getTotalUsersCount } from "./getTotalUsersCount";

interface GlobalLeaderboardResponse {
  users: FirebaseUserDataInterface[];
  totalUsers: number;
}

export const getGlobalLeaderboard = async (
  sortBy: SortByType,
  page: number,
  itemsPerPage: number
): Promise<GlobalLeaderboardResponse> => {
  try {
    const cacheKey = `leaderboard:${sortBy}:${page}:${itemsPerPage}`;

    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [usersResponse, totalCount] = await Promise.all([
      firebaseGetUsersExceriseRaport(sortBy, page, itemsPerPage),
      getTotalUsersCount(),
    ]);

    const result = {
      users: usersResponse.users,
      totalUsers: totalCount,
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
