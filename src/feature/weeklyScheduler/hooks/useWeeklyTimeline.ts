import { useState, useEffect, useMemo } from "react";
import { getWeeklySchedule } from "../services/weeklyScheduler.service";
import { getCurrentWeekStart, getWeekDays, getDayOfWeekKey } from "../utils/dateUtils";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { Song } from "feature/songs/types/songs.type";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { DayOfWeek } from "../types/weeklyScheduler.types";

export type DayTimelineData = {
  [key in DayOfWeek]: (Exercise | ExercisePlan | Song)[];
};

export const useWeeklyTimeline = (userAuth: string) => {
  const [weeklyData, setWeeklyData] = useState<DayTimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const weekStartDate = useMemo(() => getCurrentWeekStart(), []);
  const weekDays = useMemo(() => getWeekDays(weekStartDate), [weekStartDate]);

  useEffect(() => {
    if (!userAuth) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [schedule, userSongs, userPlans] = await Promise.all([
          getWeeklySchedule(userAuth, weekStartDate),
          getUserSongs(userAuth),
          getUserExercisePlans(userAuth)
        ]);

        const allUserSongs = [...(userSongs.wantToLearn || []), ...(userSongs.learning || []), ...(userSongs.learned || [])];
        const allUserPlans = [...defaultPlans, ...userPlans];

        const fullSchedule: any = {};

        const dayKeys: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

        dayKeys.forEach(dayKey => {
          const daySchedule = schedule?.days[dayKey];
          const scheduleItems = daySchedule?.items || [];

          fullSchedule[dayKey] = scheduleItems.map(itemEntry => {
            if (itemEntry.type === "plan") {
              return allUserPlans.find(p => p.id === itemEntry.id);
            }
            if (itemEntry.type === "song") {
              return allUserSongs.find(s => s.id === itemEntry.id);
            }
            return undefined;
          }).filter(Boolean);
        });

        setWeeklyData(fullSchedule);
      } catch (error) {
        console.error("Failed to load weekly timeline data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userAuth, weekStartDate]);

  return { weeklyData, isLoading, weekDays };
};
