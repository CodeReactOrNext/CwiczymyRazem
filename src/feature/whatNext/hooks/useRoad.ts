import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useFeatureGoals } from "feature/whatNext/hooks/useFeatureGoals";
import { useWhatNextStore } from "feature/whatNext/store/whatNext.store";
import type { WhatNextResult } from "feature/whatNext/types/whatNext.types";
import type { RoadStop } from "feature/whatNext/utils/buildRoad";
import {
  buildRoad,
  withoutSnoozedGoals,
} from "feature/whatNext/utils/buildRoad";
import { pendingFeatureGoals } from "feature/whatNext/utils/featureGoalsView";
import { useMemo } from "react";
import { useAppSelector } from "store/hooks";

/** The road as drawn: three stops from the ranked actions and the "use it once" goals. */
export const useRoad = (result: WhatNextResult | null): RoadStop[] | null => {
  const lvl = useAppSelector(selectCurrentUserStats)?.lvl ?? 1;
  const { data: goalState } = useFeatureGoals();
  const snoozed = useWhatNextStore((state) => state.snoozed);

  return useMemo(() => {
    if (!result) return null;
    // "Not this week" on a goal: off the road until then.
    const pending = goalState
      ? withoutSnoozedGoals(pendingFeatureGoals(goalState.goals, lvl), snoozed)
      : [];
    return buildRoad(result, pending);
  }, [result, goalState, lvl, snoozed]);
};
