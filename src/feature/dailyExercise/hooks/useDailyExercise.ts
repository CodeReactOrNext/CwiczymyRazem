import { useQuery } from "@tanstack/react-query";
import {
  dailyLeaderboardQueryKey,
  fetchDailyLeaderboard,
} from "feature/dailyExercise/services/dailyExercise.service";
import {
  getDailyDayKey,
  getDailyExercise,
  getMsUntilNextDailyExercise,
} from "feature/dailyExercise/utils/dailyExercise";
import { useEffect, useState } from "react";

/**
 * Today's exercise, its board and the time left on it. The clock ticks once a
 * minute, which is enough to roll the card over to the next day at midnight
 * UTC without a reload.
 */
export const useDailyExercise = (uid: string | null) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const dayKey = getDailyDayKey(new Date(now));
  const exercise = getDailyExercise(dayKey);
  const msLeft = getMsUntilNextDailyExercise(new Date(now));

  const leaderboard = useQuery({
    queryKey: dailyLeaderboardQueryKey(dayKey, uid),
    queryFn: () => fetchDailyLeaderboard(dayKey, uid),
    staleTime: 60_000,
    // A run banked in a session just now has to show up on the way back to Home.
    refetchOnMount: "always",
  });

  return { dayKey, exercise, msLeft, leaderboard };
};
