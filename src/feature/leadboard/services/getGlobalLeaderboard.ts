import type { SortByType } from "feature/leadboard/components/LeadboardLayout";
import { logger } from "feature/logger/Logger";
import type { FirebaseUserDataInterface } from "utils/firebase/client/firebase.types";
import { firebaseGetUsersExceriseRaport } from "utils/firebase/client/firebase.utils";

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
    const [usersResponse, totalCount] = await Promise.all([
      firebaseGetUsersExceriseRaport(sortBy, page, itemsPerPage),
      getTotalUsersCount(),
    ]);

    return {
      users: usersResponse.users,
      totalUsers: totalCount,
    };
  } catch (error) {
    logger.error(error, {
      context: "getGlobalLeaderboard",
    });
    throw error;
  }
}; 