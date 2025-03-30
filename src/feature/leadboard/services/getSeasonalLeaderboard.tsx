import type { SortByType } from "feature/leadboard/components/LeadboardLayout";
import { logger } from "feature/logger/Logger";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const getSeasonalLeaderboard = async (
  seasonId: string,
  sortBy: SortByType,
  page: number,
  itemsPerPage: number
) => {
  try {
    const seasonalUsersRef = collection(db, "seasons", seasonId, "users");

    const totalSnapshot = await getCountFromServer(seasonalUsersRef);
    const total = totalSnapshot.data().count;

    if (total === 0) {
      logger.error("No users found in season", {
        context: "getSeasonalLeaderboard",
      });
      return { users: [], totalUsers: 0 };
    }

    const q = query(
      seasonalUsersRef,
      orderBy(sortBy, "desc"),
      limit(itemsPerPage)
    );

    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        profileId: doc.id,
        displayName: data.displayName || "",
        avatar: data.avatar || "",
        statistics: {
          points: data.points || 0,
          sessionCount: data.sessionCount || 0,
          time: {
            creativity: data.time?.creativity || 0,
            hearing: data.time?.hearing || 0,
            technique: data.time?.technique || 0,
            theory: data.time?.theory || 0,
            longestSession: data.time?.longestSession || 0,
          },
          achievements: data.achievements || [],
          lvl: data.lvl || 1,
          lastReportDate: data.lastReportDate || "",
        },
      };
    });

    return {
      users,
      totalUsers: total,
    };
  } catch (error) {
    throw error;
  }
};
