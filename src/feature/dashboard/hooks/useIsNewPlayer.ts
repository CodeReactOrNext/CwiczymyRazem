import { useDashboardData } from "feature/dashboard/context/DashboardContext";
import {
  countPracticeDays,
  FULL_HOME_PRACTICE_DAYS,
  isNewPlayerByDays,
} from "feature/dashboard/utils/dashboardLayout";
import { useLastKnown } from "lib/querySnapshot/useLastKnown";

/**
 * Whether the account is still in its first few practice days — Home shows it
 * fewer cards and holds the support banner back.
 *
 * The answer comes from the activity log, which loads after the page. Until it
 * does, the answer from the last visit stands in, so a long-time player never
 * sees the short Home flash by; on a device's very first visit the session
 * counter is the guess.
 */
export const useIsNewPlayer = (): boolean => {
  const { userAuth, userStats, activity } = useDashboardData();

  const fresh = activity.isLoading
    ? undefined
    : isNewPlayerByDays(
        countPracticeDays(activity.reportList.map((report) => report.date)),
      );
  const known = useLastKnown("home-new-player", userAuth, fresh);

  return known ?? (userStats.sessionCount ?? 0) < FULL_HOME_PRACTICE_DAYS;
};
