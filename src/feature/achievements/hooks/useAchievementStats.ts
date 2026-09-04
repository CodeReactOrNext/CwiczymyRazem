import { useQuery } from "@tanstack/react-query";
import type { AchievementStatsDoc } from "lib/achievements/achievementStats";

/**
 * How many players hold each badge.
 *
 * Fetched rather than read from Firestore because `/config` has no client rule,
 * which is what stops a counter being forged. One document for the whole
 * collection, and it only moves as people finish sessions, so it is held for a
 * long time and a failure is not retried — the panel falls back to its estimate
 * rather than showing nothing.
 */
export const useAchievementStats = () =>
  useQuery<AchievementStatsDoc | null>({
    queryKey: ["achievement-stats"],
    queryFn: async () => {
      const response = await fetch("/api/achievements/stats");
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
