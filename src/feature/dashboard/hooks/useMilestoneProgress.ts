import { useQuery } from "@tanstack/react-query";
import { firebaseGetPracticeLevels } from "feature/aiSummary/services/practiceLevels.service";
import {
  computeProgressData,
  isoWeekKey,
} from "feature/aiSummary/utils/milestoneLogic";
import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import type { MilestoneStatus } from "feature/dashboard/utils/milestoneSummary";
import { milestoneStatuses } from "feature/dashboard/utils/milestoneSummary";
import type { MilestoneDay } from "feature/dashboard/utils/milestoneWeek";
import { milestoneWeekDays } from "feature/dashboard/utils/milestoneWeek";
import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import { useMemo, useState } from "react";

const STALE_TIME = 5 * 60 * 1000;

export const practiceLogsQueryKey = (uid: string, year: number) =>
  ["practice-logs", uid, year] as const;

export const practiceLevelsQueryKey = (uid: string) =>
  ["practice-levels", uid] as const;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * This week's practice goals, worked out once however many milestone cards
 * are on the page: both reads are shared query keys, so nine separate tier
 * cards cost exactly the same two requests as one of them.
 *
 * Both sources sit behind the same caches the Milestones page and the sidebar
 * dot already use, so mounting these usually costs nothing at all.
 */
export const useMilestoneProgress = (): {
  statuses: MilestoneStatus[] | null;
  /** This week's seven days, shared by every card's chart. */
  days: MilestoneDay[] | null;
  weekKey: string;
  isLoading: boolean;
  isError: boolean;
} => {
  const { userAuth, userStats } = useDashboardData();
  const [today] = useState(startOfToday);
  const year = today.getFullYear();

  const logsQuery = useQuery({
    queryKey: practiceLogsQueryKey(userAuth, year),
    queryFn: () => firebaseGetUserRaprotsLogs(userAuth, year),
    staleTime: STALE_TIME,
  });
  const levelsQuery = useQuery({
    queryKey: practiceLevelsQueryKey(userAuth),
    queryFn: () => firebaseGetPracticeLevels(userAuth),
    staleTime: STALE_TIME,
  });

  const weekKey = useMemo(() => isoWeekKey(today), [today]);
  const playerLvl = userStats.lvl ?? 1;

  const statuses = useMemo(() => {
    if (!logsQuery.data || !levelsQuery.data) return null;
    return milestoneStatuses({
      progress: computeProgressData(logsQuery.data, today),
      levels: levelsQuery.data,
      weekKey,
      playerLvl,
    });
  }, [logsQuery.data, levelsQuery.data, today, weekKey, playerLvl]);

  const days = useMemo(
    () => (logsQuery.data ? milestoneWeekDays(logsQuery.data, today) : null),
    [logsQuery.data, today],
  );

  // A failed read is an answer of its own: without it the cards would sit on a
  // skeleton for the rest of the session, which reads as "still loading".
  const isError = logsQuery.isError || levelsQuery.isError;

  return {
    statuses,
    days,
    weekKey,
    isLoading: statuses === null && !isError,
    isError,
  };
};
