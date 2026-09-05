import type { PageTab } from "components/PageTabs/PageTabs";
import { PROGRESS_TABS } from "constants/navTabs";
import { achievementsData } from "feature/achievements";
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
 */
export const useProgressTabs = (): PageTab[] => {
  const stats = useAppSelector(selectCurrentUserStats);
  const owned = stats?.achievements?.length ?? 0;

  return useMemo(
    () =>
      PROGRESS_TABS.map((tab) =>
        tab.href === "/profile/achievements"
          ? { ...tab, badge: `${owned}/${achievementsData.length}` }
          : tab
      ),
    [owned]
  );
};
