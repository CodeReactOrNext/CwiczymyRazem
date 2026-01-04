import { useQuery } from "@tanstack/react-query";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import { AchievementContext } from "../types";
import { StatisticsDataInterface } from "types/api.types";
import { SongListInterface } from "src/pages/api/user/report";

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

  // We mock reportData and inputData as they are not relevant for static progress display
  // or we could use optional chaining in checks but our factories assume they exist.
  // Ideally, we should update AchievementContext type to make these optional or partial,
  // but for now we provide safeguards/defaults.

  return {
    statistics: currentUserStats,
    songLists: userSongs as unknown as SongListInterface,
    reportData: {
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
    } as any, // Mock
  };
};
