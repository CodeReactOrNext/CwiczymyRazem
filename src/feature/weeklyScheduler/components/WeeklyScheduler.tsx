import { useState, useEffect, useMemo } from "react";
import { Calendar } from "lucide-react";
import { DayBlock } from "./DayBlock";
import { ScheduleItemSelector } from "./ScheduleItemSelector";
import { getCurrentWeekStart, getWeekDays, formatDayName, isToday, getDayOfWeekKey, formatWeekRange } from "../utils/dateUtils";
import { getWeeklySchedule, updateDaySchedule, toggleDayCompletion, clearDaySchedule } from "../services/weeklyScheduler.service";
import type { WeeklySchedule, DayOfWeek } from "../types/weeklyScheduler.types";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { Song } from "feature/songs/types/songs.type";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import { useRouter } from "next/router";

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
    if (!selectedDay || !schedule) return;
    
    // Optimistic update
    const updatedSchedule = { ...schedule };
    updatedSchedule.days[selectedDay] = {
      ...updatedSchedule.days[selectedDay],
      planId: plan.id,
      exerciseId: undefined,
      songId: undefined
    };
    setSchedule(updatedSchedule);

    try {
      await updateDaySchedule(userAuth, weekStartDate, selectedDay, plan.id, undefined);
      await loadSchedule(true);
    } catch (error) {
      console.error("Failed to update schedule:", error);
      await loadSchedule();
    }
  };

  const handleSelectSong = async (song: Song) => {
    if (!selectedDay || !schedule) return;

    // Optimistic update
    const updatedSchedule = { ...schedule };
    updatedSchedule.days[selectedDay] = {
      ...updatedSchedule.days[selectedDay],
      planId: undefined,
      exerciseId: undefined,
      songId: song.id
    };
    setSchedule(updatedSchedule);

    try {
      await updateDaySchedule(userAuth, weekStartDate, selectedDay, undefined, undefined, song.id);
      await loadSchedule(true);
    } catch (error) {
      console.error("Failed to update schedule:", error);
      await loadSchedule();
    }
  };

  const handleToggleComplete = async (day: DayOfWeek, currentStatus: boolean) => {
    if (!schedule) return;

    // Optimistic update
    const updatedSchedule = { ...schedule };
    updatedSchedule.days[day] = {
      ...updatedSchedule.days[day],
      completed: !currentStatus
    };
    setSchedule(updatedSchedule);

    try {
      await toggleDayCompletion(userAuth, weekStartDate, day, !currentStatus);
      await loadSchedule(true);
    } catch (error) {
      console.error("Failed to toggle completion:", error);
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

  const handleStart = async (day: DayOfWeek) => {
    const item = getSelectedItem(day);
    if (!item || !schedule) return;

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

  const getSelectedItem = (day: DayOfWeek): Exercise | ExercisePlan | Song | undefined => {
    if (!schedule) return undefined;
    const daySchedule = schedule.days[day];
    
    if (daySchedule.planId) {
      const allPlans = [...defaultPlans, ...userPlans];
      return allPlans.find(p => p.id === daySchedule.planId);
    }
    
    if (daySchedule.exerciseId) {
      return allExercises.find(e => e.id === daySchedule.exerciseId);
    }

    if (daySchedule.songId) {
      const allSongs = [...userSongs.wantToLearn, ...userSongs.learning, ...userSongs.learned];
      return allSongs.find(s => s.id === daySchedule.songId);
    }
    
    return undefined;
  };



  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-zinc-900 rounded w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-48 bg-zinc-900 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1 flex items-center gap-3">
            Your Week
            <span className="text-base font-bold text-zinc-600 flex items-center gap-1.5">
              <Calendar size={14} />
              {formatWeekRange(weekStartDate)}
            </span>
          </h2>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {weekDays.map((date, index) => {
          const dayKey = getDayOfWeekKey(date);
          const daySchedule = schedule?.days[dayKey] || { completed: false };
          const isCollapsed = isMobile && expandedDay !== dayKey;
          
          return (
            <DayBlock
              key={dayKey}
              dayName={formatDayName(date)}
              daySchedule={daySchedule}
              isToday={isToday(date)}
              isCollapsed={isCollapsed}
              onClick={() => handleDayClick(dayKey)}
              onToggleComplete={(e) => {
                e.stopPropagation();
                handleToggleComplete(dayKey, daySchedule.completed);
              }}
              onClear={(e) => {
                e.stopPropagation();
                handleClearDay(dayKey);
              }}
              onStart={(e) => {
                e.stopPropagation();
                handleStart(dayKey);
              }}
              selectedItem={getSelectedItem(dayKey)}
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
