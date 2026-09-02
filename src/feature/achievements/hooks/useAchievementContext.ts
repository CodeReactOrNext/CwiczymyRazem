import { useQuery } from "@tanstack/react-query";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import type {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import type { SongListInterface } from "src/pages/api/user/report";
import { useAppSelector } from "store/hooks";

import type { AchievementContext } from "../types";

/**
 * Progress bars only ever read `statistics` and `songLists` — the session
 * halves of the context have no meaning outside a submitted report. They are
 * still filled with a real, empty session: `inputTimeConverter` reads the
 * `*Hours`/`*Minutes` strings, so the previous zeroed `techniqueTime`-style
 * fields turned every session check into a silent `NaN` comparison.
 */
const EMPTY_SESSION_RESULTS: ReportDataInterface = {
  reportDate: new Date(0),
  totalPoints: 0,
  bonusPoints: {
    multiplier: 0,
    habitsCount: 0,
    additionalPoints: 0,
    time: 0,
    timePoints: 0,
  },
};

const EMPTY_INPUT_DATA: ReportFormikInterface = {
  techniqueHours: "0",
  techniqueMinutes: "0",
  theoryHours: "0",
  theoryMinutes: "0",
  hearingHours: "0",
  hearingMinutes: "0",
  creativityHours: "0",
  creativityMinutes: "0",
  countBackDays: 0,
  reportTitle: "",
  habbits: [],
  avatarUrl: null,
};

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
    sessionResults: EMPTY_SESSION_RESULTS,
    inputData: EMPTY_INPUT_DATA,
  };
};
