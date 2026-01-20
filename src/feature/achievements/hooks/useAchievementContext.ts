import { useQuery } from "@tanstack/react-query";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import type { SongListInterface } from "src/pages/api/user/report";
import { useAppSelector } from "store/hooks";

import type { AchievementContext } from "../types";

export const useAchievementContext = (): AchievementContext | null => {
  const currentUserId = useAppSelector(selectUserAuth);
  const currentUserStats = useAppSelector(selectCurrentUserStats);

  const { data: userSongs } = useQuery({
    queryKey: ["user-songs", currentUserId],
    queryFn: () => getUserSongs(currentUserId!),
    enabled: !!currentUserId,
    staleTime: 10 * 60 * 1000,
  });

  if (!currentUserStats || !userSongs) {
    return null;
  }

  return {
    statistics: currentUserStats,
    songLists: userSongs as unknown as SongListInterface,
    sessionResults: {
      totalPoints: 0,
      bonusPoints: {
        habitsCount: 0,
      },
      skillPointsGained: {
        technique: 0,
        theory: 0,
        hearing: 0,
        creativity: 0,
      }
    } as any,
    inputData: {
      habbits: [],
      countBackDays: null,
      date: new Date().toISOString(),
      techniqueTime: 0,
      theoryTime: 0,
      hearingTime: 0,
      creativityTime: 0,
    } as any,
  };
};
