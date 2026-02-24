import { useState, useEffect, useMemo } from "react";
import { Calendar } from "lucide-react";
import { DayBlock } from "./DayBlock";
import { ScheduleItemSelector } from "./ScheduleItemSelector";
import { getCurrentWeekStart, getWeekDays, formatDayName, isToday, getDayOfWeekKey, formatWeekRange } from "../utils/dateUtils";
import { getWeeklySchedule, addItemToDaySchedule, removeItemFromDaySchedule, toggleItemCompletion, toggleDayCompletion, clearDaySchedule } from "../services/weeklyScheduler.service";
import type { WeeklySchedule, DayOfWeek, ScheduleItemEntry } from "../types/weeklyScheduler.types";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { Song } from "feature/songs/types/songs.type";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import { useRouter } from "next/router";
import posthog from "posthog-js";

interface WeeklySchedulerProps {
  userAuth: string;
}

const DAY_COLORS = ["cyan", "emerald", "violet", "amber", "rose", "blue", "fuchsia"];

export const WeeklyScheduler = ({ userAuth }: WeeklySchedulerProps) => {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const [userSongs, setUserSongs] = useState<{
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }>({ wantToLearn: [], learning: [], learned: [] });
  const [userPlans, setUserPlans] = useState<ExercisePlan[]>([]);

  const weekStartDate = useMemo(() => getCurrentWeekStart(), []);
  const weekDays = useMemo(() => getWeekDays(weekStartDate), [weekStartDate]);

  const allExercises = useMemo(() => {
    const exercisesSet = new Map<string, Exercise>();
    defaultPlans.forEach(plan => {
      plan.exercises.forEach(exercise => {
        exercisesSet.set(exercise.id, exercise);
      });
    });
    return Array.from(exercisesSet.values());
  }, []);

  useEffect(() => {
    if (!userAuth) return;
    loadSchedule();
    loadUserSongs();
    loadUserPlans();

    // Mobile detection & initial expansion
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    
    // Default to today
    const todayKey = getDayOfWeekKey(new Date());
    setExpandedDay(todayKey);

    return () => window.removeEventListener("resize", handleResize);
  }, [userAuth]);

  const loadUserPlans = async () => {
    try {
      const plans = await getUserExercisePlans(userAuth);
      setUserPlans(plans);
    } catch (error) {
      console.error("Failed to load user plans:", error);
    }
  };

  const loadUserSongs = async () => {
    try {
      const songs = await getUserSongs(userAuth);
      setUserSongs({
        wantToLearn: songs.wantToLearn || [],
        learning: songs.learning || [],
        learned: songs.learned || [],
      });
    } catch (error) {
      console.error("Failed to load user songs:", error);
    }
  };

  const loadSchedule = async (silent = false) => {
    try {
      if (!silent || !schedule) setIsLoading(true);
      const data = await getWeeklySchedule(userAuth, weekStartDate);
      setSchedule(data);
    } catch (error) {
      console.error("Failed to load schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayClick = (day: DayOfWeek) => {
    if (isMobile) {
      if (expandedDay === day) {
        setSelectedDay(day);
        setIsSelectorOpen(true);
      } else {
        setExpandedDay(day);
      }
    } else {
      setSelectedDay(day);
      setIsSelectorOpen(true);
    }
  };

  const handleSelectPlan = async (plan: ExercisePlan) => {
    if (!selectedDay) return;
    
    try {
      await addItemToDaySchedule(userAuth, weekStartDate, selectedDay, { id: plan.id, type: "plan" });
      posthog.capture("calendar_task_added", {
        item_id: plan.id,
        item_type: "plan",
        day: selectedDay,
      });
      await loadSchedule(true);
    } catch (error) {
      console.error("Failed to update schedule:", error);
      await loadSchedule();
    }
  };

  const handleSelectSong = async (song: Song) => {
    if (!selectedDay) return;

    try {
      await addItemToDaySchedule(userAuth, weekStartDate, selectedDay, { id: song.id, type: "song" });
      posthog.capture("calendar_task_added", {
        item_id: song.id,
        item_type: "song",
        day: selectedDay,
      });
      await loadSchedule(true);
    } catch (error) {
      console.error("Failed to update schedule:", error);
      await loadSchedule();
    }
  };

  const handleRemoveItem = async (day: DayOfWeek, itemId: string) => {
    try {
      await removeItemFromDaySchedule(userAuth, weekStartDate, day, itemId);
      await loadSchedule(true);
    } catch (error) {
      console.error("Failed to remove item:", error);
      await loadSchedule();
    }
  };

  const handleToggleItemComplete = async (day: DayOfWeek, itemId: string, currentStatus: boolean) => {
    try {
      await toggleItemCompletion(userAuth, weekStartDate, day, itemId, !currentStatus);
      await loadSchedule(true);
    } catch (error) {
      console.error("Failed to toggle item completion:", error);
      await loadSchedule();
    }
  };

  const handleClearDay = async (day: DayOfWeek) => {
    if (!schedule) return;

    // Optimistic update
    const updatedSchedule = { ...schedule };
    updatedSchedule.days[day] = {
      completed: false,
      planId: undefined,
      exerciseId: undefined,
      songId: undefined
    };
    setSchedule(updatedSchedule);

    try {
      await clearDaySchedule(userAuth, weekStartDate, day);
      await loadSchedule(true);
    } catch (error) {
      console.error("Failed to clear schedule:", error);
      await loadSchedule();
    }
  };

  const handleStart = async (item: Exercise | ExercisePlan | Song) => {
    // Determine path
    let path = "/dashboard";
    if ("exercises" in item) {
      // It's a plan
      path = `/profile/exercises?planId=${item.id}`;
    } else if ("artist" in item) {
      // It's a song - redirected to direct practice view
      path = `/timer/song/${item.id}`;
    } else {
      // It's a single exercise
      path = `/profile/exercises?exerciseId=${item.id}`;
    }

    // Navigate without immediate auto-completion (as requested to avoid jarring UI)
    router.push(path);
  };

  const getSelectedItems = (day: DayOfWeek): (Exercise | ExercisePlan | Song)[] => {
    if (!schedule) return [];
    const daySchedule = schedule.days[day];
    const items = daySchedule.items || [];

    // Migrate legacy if necessary
    if (items.length === 0) {
      if (daySchedule.planId) {
        const plan = [...defaultPlans, ...userPlans].find(p => p.id === daySchedule.planId);
        if (plan) return [plan];
      }
      if (daySchedule.exerciseId) {
        const exercise = allExercises.find(e => e.id === daySchedule.exerciseId);
        if (exercise) return [exercise];
      }
      if (daySchedule.songId) {
        const song = [...userSongs.wantToLearn, ...userSongs.learning, ...userSongs.learned].find(s => s.id === daySchedule.songId);
        if (song) return [song];
      }
      return [];
    }

    return items.map(itemEntry => {
      if (itemEntry.type === "plan") {
        return [...defaultPlans, ...userPlans].find(p => p.id === itemEntry.id);
      }
      if (itemEntry.type === "song") {
        return [...userSongs.wantToLearn, ...userSongs.learning, ...userSongs.learned].find(s => s.id === itemEntry.id);
      }
      if (itemEntry.type === "exercise") {
        return allExercises.find(e => e.id === itemEntry.id);
      }
      return undefined;
    }).filter(Boolean) as (Exercise | ExercisePlan | Song)[];
  };



  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-zinc-900 rounded w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-[160px] bg-zinc-900 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-4 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white tracking-wide">
            Your Week
          </h3>
          <span className="text-[10px] sm:text-xs font-bold text-zinc-400 flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800/40 ">
            <Calendar size={12} className="opacity-80" />
            {formatWeekRange(weekStartDate)}
          </span>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {weekDays.map((date, index) => {
          const dayKey = getDayOfWeekKey(date);
          const daySchedule = schedule?.days[dayKey] || { completed: false };
          const isCollapsed = isMobile && expandedDay !== dayKey;
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isFuture = date > today;
          
          return (
            <DayBlock
              key={dayKey}
              dayName={formatDayName(date)}
              daySchedule={daySchedule}
              isToday={isToday(date)}
              isCollapsed={isCollapsed}
              isFuture={isFuture}
              onClick={() => handleDayClick(dayKey)}
              onClear={(e) => {
                e.stopPropagation();
                handleClearDay(dayKey);
              }}
              onStart={(item: Exercise | ExercisePlan | Song) => {
                handleStart(item);
              }}
              onRemoveItem={(itemId: string) => {
                handleRemoveItem(dayKey, itemId);
              }}
              onToggleItemComplete={(itemId: string, currentStatus: boolean) => {
                handleToggleItemComplete(dayKey, itemId, currentStatus);
              }}
              selectedItems={getSelectedItems(dayKey)}
              dayColor={DAY_COLORS[index]}
            />
          );
        })}
      </div>

      <ScheduleItemSelector
        isOpen={isSelectorOpen}
        onClose={() => {
          setIsSelectorOpen(false);
          setSelectedDay(null);
        }}
        onSelectPlan={handleSelectPlan}
        onSelectSong={handleSelectSong}
        userSongs={userSongs}
        userPlans={userPlans}
      />
    </div>
  );
};
