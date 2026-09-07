import { useQuery } from "@tanstack/react-query";
import { useActivityLogReports } from "components/ActivityLog/hooks/useActivityLogReports";
import { summarizeArsenal } from "feature/arsenal/data/arsenalSummary";
import { useArsenalData } from "feature/arsenal/hooks/useArsenalData";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { selectCurrentUserStats, selectUserAuth } from "feature/user/store/userSlice";
import type {
  ReportDataInterface,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import { useMemo } from "react";
import type { SongListInterface } from "src/pages/api/user/report";
import { useAppSelector } from "store/hooks";
import {
  getLongestStreakFromActivityLog,
  getReconciledStreak,
} from "utils/gameLogic";

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

  // Gear progress bars need the stash. It is the same cached query the Arsenal
  // itself runs, so opening a profile after the Arsenal costs no extra request.
  const { data: arsenal } = useArsenalData();

  const { data: userSongs } = useQuery({
    queryKey: ["user-songs", currentUserId],
    queryFn: () => getUserSongs(currentUserId!),
    enabled: !!currentUserId,
    staleTime: 10 * 60 * 1000,
  });

  // The streak badges read the stored counters, which a past timezone slip pins
  // to the wrong calendar day for good — that is the "streak is 100+ but the
  // badge says 41/100" report. The activity log holds the real practice instants
  // and is read back in the viewer's local time, so it is what every other
  // streak in the UI is already reconciled against (see getReconciledStreak).
  // Same all-time query the header streak runs, so it is served from cache.
  const { reportList } = useActivityLogReports(currentUserId ?? "", "all");

  const reportDates = useMemo(
    () => (reportList ?? []).map((report) => report.date),
    [reportList]
  );

  // Memoised because consumers key work off this object: the panel evaluates 77
  // checks twice over from it, and a fresh literal every render would defeat
  // that memo on every unrelated re-render.
  return useMemo(() => {
    if (!currentUserStats || !userSongs) return null;

    const { dayWithoutBreak: currentStreak } = getReconciledStreak({
      actualDayWithoutBreak: currentUserStats.actualDayWithoutBreak ?? 0,
      lastReportDate: currentUserStats.lastReportDate,
      reportDates,
    });

    // The record only ever climbs: a log that has been trimmed (or has not
    // loaded yet) must not talk a player out of a badge they already hold.
    const longestStreak = Math.max(
      currentUserStats.dayWithoutBreak ?? 0,
      getLongestStreakFromActivityLog(reportDates)
    );

    return {
      statistics: {
        ...currentUserStats,
        actualDayWithoutBreak: currentStreak,
        dayWithoutBreak: longestStreak,
      },
      songLists: userSongs as unknown as SongListInterface,
      arsenal: summarizeArsenal(arsenal),
      sessionResults: EMPTY_SESSION_RESULTS,
      inputData: EMPTY_INPUT_DATA,
    };
  }, [currentUserStats, userSongs, arsenal, reportDates]);
};
