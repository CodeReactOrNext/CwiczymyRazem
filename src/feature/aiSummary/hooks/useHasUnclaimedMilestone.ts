import { useQuery, useQueryClient } from "@tanstack/react-query";
import { firebaseGetPracticeLevels } from "feature/aiSummary/services/practiceLevels.service";
import {
  computeProgressData,
  isoWeekKey,
  LEVELS,
} from "feature/aiSummary/utils/milestoneLogic";
import {
  practiceLevelsQueryKey,
  practiceLogsQueryKey,
} from "feature/dashboard/hooks/useMilestoneProgress";
import { isFeatureUnlocked } from "feature/levelGate/data/featureUnlocks";
import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserInfo,
} from "feature/user/store/userSlice";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef } from "react";
import { useAppSelector } from "store/hooks";

const STALE_TIME = 5 * 60 * 1000;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * True when the user has at least one milestone whose weekly goal is met and
 * owned but whose reward hasn't been claimed this week — i.e. free Fame waiting
 * to be collected. Drives the "unclaimed reward" dot in the sidebar, the mobile
 * tab bar and the Milestones tab.
 *
 * Reads the same query keys as the milestone cards and the Milestones page, so
 * a claim made anywhere puts the dot out straight away instead of on the next
 * page. Off while Milestones are still locked: there is nothing to claim and
 * nowhere to go yet. Both sources also sit behind memory caches (logs 2 days,
 * practice levels 5 min), which keeps the re-check on navigation essentially
 * free.
 */
export function useHasUnclaimedMilestone(): boolean {
  const userAuth = useAppSelector(selectUserAuth);
  const userStats = useAppSelector(selectCurrentUserStats);
  const userInfo = useAppSelector(selectUserInfo);
  // Same rule as the page's LevelGate, admins included.
  const unlocked =
    userInfo?.role === "admin" ||
    (!!userStats && isFeatureUnlocked("summary", userStats.lvl));
  const enabled = !!userAuth && unlocked;
  const { asPath } = useRouter();
  const queryClient = useQueryClient();
  const uid = userAuth ?? "";
  const today = startOfToday();
  const year = today.getFullYear();

  const { data: logs } = useQuery({
    queryKey: practiceLogsQueryKey(uid, year),
    queryFn: () => firebaseGetUserRaprotsLogs(uid, year),
    enabled,
    staleTime: STALE_TIME,
  });
  const { data: levels } = useQuery({
    queryKey: practiceLevelsQueryKey(uid),
    queryFn: () => firebaseGetPracticeLevels(uid),
    enabled,
    staleTime: STALE_TIME,
  });

  // The bars that show the dot stay mounted across pages, so nothing would
  // refetch after a practice session. Re-check on navigation (cache-backed).
  const lastPath = useRef(asPath);
  useEffect(() => {
    if (!enabled || lastPath.current === asPath) return;
    lastPath.current = asPath;
    void queryClient.invalidateQueries({ queryKey: practiceLogsQueryKey(uid, year) });
    void queryClient.invalidateQueries({ queryKey: practiceLevelsQueryKey(uid) });
  }, [asPath, enabled, uid, year, queryClient]);

  const dayKey = today.getTime();
  return useMemo(() => {
    if (!enabled || !logs || !levels) return false;
    const day = new Date(dayKey);
    const progress = computeProgressData(logs, day);
    const weekKey = isoWeekKey(day);
    const owned = new Set(levels.ownedLevelIds);
    return LEVELS.some(
      (l) =>
        l.isMet(progress) &&
        owned.has(l.id) &&
        levels.claims[l.id]?.weekKey !== weekKey
    );
  }, [enabled, logs, levels, dayKey]);
}
