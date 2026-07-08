import { useQuery } from "@tanstack/react-query";
import { getRigLevel } from "feature/arsenal/data/rigLevel";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import { doc, getDoc } from "firebase/firestore";
import { useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";

import { getUserGearRank } from "../services/getUserGearRank";
import { getUserRank } from "../services/getUserRank";
import type { LeaderboardViewType } from "./useLeaderboard";

interface UseUserRankReturn {
  userRank: number | null;
  isLoading: boolean;
}

export const useUserRank = (
  view: LeaderboardViewType,
  seasonId?: string
): UseUserRankReturn => {
  const userAuth = useAppSelector(selectUserAuth);
  const currentUserStats = useAppSelector(selectCurrentUserStats);

  const globalPoints = currentUserStats?.points ?? 0;

  // Step 1a: For seasonal view, get user's seasonal points
  const { data: seasonalPoints } = useQuery({
    queryKey: ['seasonalUserPoints', userAuth, seasonId],
    queryFn: async () => {
      if (!userAuth || !seasonId) return null;
      const userRef = doc(db, 'seasons', seasonId, 'users', userAuth);
      const snap = await getDoc(userRef);
      return snap.exists() ? snap.data()?.points ?? null : null;
    },
    enabled: view === "seasonal" && !!userAuth && !!seasonId,
    staleTime: 5 * 60 * 1000,
  });

  // Step 1b: For gear view, get user's rig level (computed fallback covers
  // accounts the backfill hasn't reached yet)
  const { data: gearLevel } = useQuery({
    queryKey: ['userGearLevel', userAuth],
    queryFn: async () => {
      if (!userAuth) return null;
      const snap = await getDoc(doc(db, 'users', userAuth));
      if (!snap.exists()) return null;
      const data = snap.data();
      return data?.rigLevel ?? getRigLevel(data?.arsenal ?? null);
    },
    enabled: view === "gear" && !!userAuth,
    staleTime: 5 * 60 * 1000,
  });

  const scoreToQuery =
    view === "seasonal" ? seasonalPoints : view === "gear" ? gearLevel : globalPoints;
  const canQueryRank =
    !!userAuth &&
    scoreToQuery !== null &&
    scoreToQuery !== undefined &&
    scoreToQuery >= 0;

  // Step 2: Get rank based on the score
  const { data: userRank, isLoading } = useQuery({
    queryKey: [
      'userRank',
      userAuth,
      view === "seasonal" ? seasonId : view,
      scoreToQuery,
    ],
    queryFn: () =>
      view === "gear"
        ? getUserGearRank(scoreToQuery!)
        : getUserRank(scoreToQuery!, view === "seasonal" ? seasonId : undefined),
    enabled: canQueryRank,
    staleTime: 5 * 60 * 1000,
  });

  return { userRank: userRank ?? null, isLoading };
};
