import { useQuery } from "@tanstack/react-query";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import { doc, getDoc } from "firebase/firestore";
import { useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";
import { getUserRank } from "../services/getUserRank";

interface UseUserRankReturn {
  userRank: number | null;
  isLoading: boolean;
}

export const useUserRank = (
  isSeasonalView: boolean,
  seasonId?: string
): UseUserRankReturn => {
  const userAuth = useAppSelector(selectUserAuth);
  const currentUserStats = useAppSelector(selectCurrentUserStats);

  const globalPoints = currentUserStats?.points ?? 0;

  // Step 1: For seasonal view, get user's seasonal points
  const { data: seasonalPoints } = useQuery({
    queryKey: ['seasonalUserPoints', userAuth, seasonId],
    queryFn: async () => {
      if (!userAuth || !seasonId) return null;
      const userRef = doc(db, 'seasons', seasonId, 'users', userAuth);
      const snap = await getDoc(userRef);
      return snap.exists() ? snap.data()?.points ?? null : null;
    },
    enabled: isSeasonalView && !!userAuth && !!seasonId,
    staleTime: 5 * 60 * 1000,
  });

  const pointsToQuery = isSeasonalView ? seasonalPoints : globalPoints;
  const canQueryRank =
    !!userAuth &&
    pointsToQuery !== null &&
    pointsToQuery !== undefined &&
    pointsToQuery >= 0;

  // Step 2: Get rank based on points
  const { data: userRank, isLoading } = useQuery({
    queryKey: [
      'userRank',
      userAuth,
      isSeasonalView ? seasonId : 'global',
      pointsToQuery,
    ],
    queryFn: () =>
      getUserRank(pointsToQuery!, isSeasonalView ? seasonId : undefined),
    enabled: canQueryRank,
    staleTime: 5 * 60 * 1000,
  });

  return { userRank: userRank ?? null, isLoading };
};
