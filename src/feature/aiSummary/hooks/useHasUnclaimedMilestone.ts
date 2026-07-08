import { firebaseGetPracticeLevels } from "feature/aiSummary/services/practiceLevels.service";
import {
computeProgressData, isoWeekKey,
  LEVELS, } from "feature/aiSummary/utils/milestoneLogic";
import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

/**
 * True when the user has at least one milestone whose weekly goal is met and
 * owned but whose reward hasn't been claimed this week — i.e. free Fame waiting
 * to be collected. Drives the sidebar "unclaimed reward" dot.
 *
 * Both data sources are cached (logs 2 days, practice levels 5 min via
 * memoryCache), so this is essentially a once-per-session fetch; later mounts
 * and route changes recompute from cache without new reads until the TTL lapses
 * or a claim/purchase invalidates the levels cache.
 */
export function useHasUnclaimedMilestone(): boolean {
  const userAuth = useAppSelector(selectUserAuth);
  const { asPath } = useRouter();
  const [hasUnclaimed, setHasUnclaimed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!userAuth) {
        if (!cancelled) setHasUnclaimed(false);
        return;
      }
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [logs, levels] = await Promise.all([
          firebaseGetUserRaprotsLogs(userAuth, today.getFullYear()),
          firebaseGetPracticeLevels(userAuth),
        ]);

        const progress = computeProgressData(logs, today);
        const weekKey = isoWeekKey(today);
        const owned = new Set(levels.ownedLevelIds);

        const any = LEVELS.some(
          l => l.isMet(progress) && owned.has(l.id) && levels.claims[l.id]?.weekKey !== weekKey
        );

        if (!cancelled) setHasUnclaimed(any);
      } catch {
        if (!cancelled) setHasUnclaimed(false);
      }
    })();

    // re-check on navigation: cheap (cache-backed) and reflects a fresh claim
    // once the user moves to another page.
    return () => {
      cancelled = true;
    };
  }, [userAuth, asPath]);

  return hasUnclaimed;
}
