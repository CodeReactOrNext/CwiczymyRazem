import { useState, useEffect, useMemo } from "react";
import { getWeeklySchedule } from "../services/weeklyScheduler.service";
import { getCurrentWeekStart, getDayOfWeekKey } from "../utils/dateUtils";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { Song } from "feature/songs/types/songs.type";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";

export const useTodaySchedule = (userAuth: string) => {
  const [items, setItems] = useState<(Exercise | ExercisePlan | Song)[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const weekStartDate = useMemo(() => getCurrentWeekStart(), []);
  const todayKey = useMemo(() => getDayOfWeekKey(new Date()), []);

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

        if (schedule && schedule.days[todayKey]) {
          const daySchedule = schedule.days[todayKey];
          const scheduleItems = daySchedule.items || [];

          const allUserSongs = [...(userSongs.wantToLearn || []), ...(userSongs.learning || []), ...(userSongs.learned || [])];
          const allUserPlans = [...defaultPlans, ...userPlans];

          const mapped = scheduleItems.map(itemEntry => {
            if (itemEntry.type === "plan") {
              return allUserPlans.find(p => p.id === itemEntry.id);
            }
            if (itemEntry.type === "song") {
              return allUserSongs.find(s => s.id === itemEntry.id);
            }
            // Add basic exercise support if needed
            return undefined;
          }).filter(Boolean) as (Exercise | ExercisePlan | Song)[];

          setItems(mapped);
        }
      } catch (error) {
        console.error("Failed to load today's schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userAuth, weekStartDate, todayKey]);

  return { items, isLoading };
};
