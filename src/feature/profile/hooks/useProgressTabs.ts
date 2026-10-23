import type { PageTab } from "components/PageTabs/PageTabs";
import { PROGRESS_TABS } from "constants/navTabs";
import { achievementsData } from "feature/achievements";
import { isFeatureUnlocked } from "feature/levelGate/data/featureUnlocks";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useMemo } from "react";
import { useAppSelector } from "store/hooks";

/**
 * The Progress tabs with the badge count filled in.
 *
 * The collection is the one section whose headline number is worth carrying on
 * the tab itself — "how many of them are there, and how many have I got" is the
 * question that makes a player open it at all, and it should be answerable
 * without opening it.
 *
 * Milestones stay off the rail until the account reaches their level, the same
 * way the sidebar leaves out pages that are still locked.
 */
export const useProgressTabs = (): PageTab[] => {
  const stats = useAppSelector(selectCurrentUserStats);
  const owned = stats?.achievements?.length ?? 0;
  const showMilestones = !!stats && isFeatureUnlocked("summary", stats.lvl);

  return useMemo(
    () =>
      PROGRESS_TABS.filter(
        (tab) => tab.href !== "/summary" || showMilestones
      ).map((tab) =>
        tab.href === "/profile/achievements"
          ? { ...tab, badge: `${owned}/${achievementsData.length}` }
          : tab
      ),
    [owned, showMilestones]
  );
};
