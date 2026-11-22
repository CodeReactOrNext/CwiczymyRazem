import { useQuery } from "@tanstack/react-query";
import { getUserSeasonalAchievements } from "feature/profile/services/seasonalAchievementsService";

/**
 * A player's season finishes, newest first. They change once a month, when a
 * season closes, so one read per player lasts the whole visit. The service
 * already turns a failed read into an empty list.
 */
export const useSeasonalAchievements = (userId?: string) =>
  useQuery({
    queryKey: ["seasonal-achievements", userId],
    queryFn: () => getUserSeasonalAchievements(userId as string),
    enabled: !!userId,
    staleTime: 30 * 60 * 1000,
  });
