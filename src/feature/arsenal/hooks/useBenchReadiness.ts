import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useMemo } from "react";
import { useAppSelector } from "store/hooks";

import type { ArsenalUserData } from "../types/arsenal.types";
import { countReadyStacks } from "../utils/forgeShelves";
import { getWorkshopEntries } from "../utils/workshopEntries";
import { getModTargets, getReadyGearIds } from "../utils/workshopReadiness";

/**
 * What the bench could do right now, worked out once for a whole screen: which
 * gear has a job ready, and where each rescued mod in the stash could go.
 *
 * Every socket, card and rack row reads its green hammer mark off this rather than
 * pricing its own quotes, so a board of a hundred pieces prices them once.
 */
export const useBenchReadiness = (data: ArsenalUserData | undefined) => {
  const fame = useAppSelector(selectCurrentUserStats)?.fame ?? 0;

  return useMemo(() => {
    const entries = getWorkshopEntries(data);
    const wallet = data?.parts ?? [];
    const salvaged = data?.salvagedMods ?? [];
    return {
      entries,
      fame,
      readyIds: getReadyGearIds(entries, wallet, fame, salvaged),
      modTargets: getModTargets(entries, wallet, fame, salvaged),
      /** Part stacks the anvil could rework right now. */
      readyStacks: countReadyStacks(wallet, fame),
    };
  }, [data, fame]);
};
