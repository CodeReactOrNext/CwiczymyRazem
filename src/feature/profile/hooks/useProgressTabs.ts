import type { PageTab } from "components/PageTabs/PageTabs";
import { PROGRESS_TABS } from "constants/navTabs";
import { achievementsData } from "feature/achievements";
import { useHasUnclaimedMilestone } from "feature/aiSummary/hooks/useHasUnclaimedMilestone";
import { isFeatureUnlocked } from "feature/levelGate/data/featureUnlocks";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { Lock } from "lucide-react";
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
 * Milestones are always on the rail, locked or not: the tab is where players
 * learn the feature exists. Until their level it leads with a lock, and once
 * a reward is waiting it carries the same dot as the Progress entry in the nav.
 */
export const useProgressTabs = (): PageTab[] => {
  const stats = useAppSelector(selectCurrentUserStats);
  const owned = stats?.achievements?.length ?? 0;
  const milestonesLocked = !!stats && !isFeatureUnlocked("summary", stats.lvl);
  const hasUnclaimedMilestone = useHasUnclaimedMilestone();

  return useMemo(
    () =>
      PROGRESS_TABS.map((tab) => {
        if (tab.href === "/profile/achievements")
          return { ...tab, badge: `${owned}/${achievementsData.length}` };
        if (tab.href === "/summary")
          return {
            ...tab,
            icon: milestonesLocked ? Lock : tab.icon,
            dot: hasUnclaimedMilestone,
          };
        return tab;
      }),
    [owned, milestonesLocked, hasUnclaimedMilestone]
  );
};
