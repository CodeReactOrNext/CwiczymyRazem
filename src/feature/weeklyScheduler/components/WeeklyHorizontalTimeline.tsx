import { useMemo, useRef, useEffect } from "react";
import { Pin, Music, TrendingUp, Plus, X, Calendar, Check, Play } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { getCurrentWeekStart, getWeekDays, getDayOfWeekKey, isToday, formatWeekRange } from "../utils/dateUtils";
import { getWeeklySchedule, addItemToDaySchedule, removeItemFromDaySchedule, clearDaySchedule, toggleItemCompletion } from "../services/weeklyScheduler.service";
import type { WeeklySchedule, DayOfWeek } from "../types/weeklyScheduler.types";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { Song } from "feature/songs/types/songs.type";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import { useState } from "react";
import { useRouter } from "next/router";
import { ScheduleItemSelector } from "./ScheduleItemSelector";

interface WeeklyHorizontalTimelineProps {
  userAuth: string;
}

export const WeeklyHorizontalTimeline = ({ userAuth }: WeeklyHorizontalTimelineProps) => {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayToAdd, setSelectedDayToAdd] = useState<DayOfWeek | null>(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [userSongs, setUserSongs] = useState<{ wantToLearn: Song[]; learning: Song[]; learned: Song[] }>({ wantToLearn: [], learning: [], learned: [] });
  const [userPlans, setUserPlans] = useState<ExercisePlan[]>([]);

  const weekStartDate = useMemo(() => getCurrentWeekStart(), []);
  const weekDays = useMemo(() => getWeekDays(weekStartDate), [weekStartDate]);

  const allExercises = useMemo(() => {
    const exercisesSet = new Map<string, Exercise>();
    defaultPlans.forEach(plan => plan.exercises.forEach(ex => exercisesSet.set(ex.id, ex)));
    return Array.from(exercisesSet.values());
  }, []);

  useEffect(() => {
    if (!userAuth) return;
    loadData();
  }, [userAuth]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sched, songs, plans] = await Promise.all([
        getWeeklySchedule(userAuth, weekStartDate),
        getUserSongs(userAuth),
        getUserExercisePlans(userAuth)
      ]);
      setSchedule(sched);
      setUserSongs({
        wantToLearn: songs.wantToLearn || [],
        learning: songs.learning || [],
        learned: songs.learned || [],
      });
      setUserPlans(plans);
    } catch (error) {
      console.error("Failed to load timeline data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getItemsForDay = (day: DayOfWeek) => {
    if (!schedule) return [];
    const daySchedule = schedule.days[day];
    const items = daySchedule.items || [];
    
    // Legacy support
    if (items.length === 0 && (daySchedule.planId || daySchedule.songId || daySchedule.exerciseId)) {
        const legacyItems = [];
        if (daySchedule.planId) legacyItems.push({ id: daySchedule.planId, type: "plan", completed: daySchedule.completed });
        if (daySchedule.songId) legacyItems.push({ id: daySchedule.songId, type: "song", completed: daySchedule.completed });
        if (daySchedule.exerciseId) legacyItems.push({ id: daySchedule.exerciseId, type: "exercise", completed: daySchedule.completed });
        return legacyItems.map(i => mapItem(i)).filter(Boolean);
    }

    return items.map(itemEntry => mapItem(itemEntry)).filter(Boolean);
  };

  const mapItem = (entry: any) => {
    let baseItem: any = null;
    if (entry.type === "plan") baseItem = [...defaultPlans, ...userPlans].find(p => p.id === entry.id);
    if (entry.type === "song") baseItem = [...userSongs.wantToLearn, ...userSongs.learning, ...userSongs.learned].find(s => s.id === entry.id);
    if (entry.type === "exercise") baseItem = allExercises.find(e => e.id === entry.id);
    
    if (baseItem) {
      return { ...baseItem, completed: !!entry.completed, scheduleItemId: entry.id };
    }
    return null;
  };

  const handleSelectItem = async (item: any) => {
    if (!selectedDayToAdd) return;
    try {
      const type = "exercises" in item ? "plan" : "artist" in item ? "song" : "exercise";
      await addItemToDaySchedule(userAuth, weekStartDate, selectedDayToAdd, { id: item.id, type: type as any });
      await loadData();
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const handleToggleCompleted = async (day: DayOfWeek, itemId: string, currentStatus: boolean) => {
    try {
      await toggleItemCompletion(userAuth, weekStartDate, day, itemId, !currentStatus);
      await loadData();
    } catch (error) {
      console.error("Failed to toggle completion:", error);
    }
  };

  const handleRemoveItem = async (day: DayOfWeek, itemId: string) => {
    try {
      await removeItemFromDaySchedule(userAuth, weekStartDate, day, itemId);
      await loadData();
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const handlePlayTask = (item: any) => {
    let path = "";
    if ("exercises" in item) {
      // It's a plan
      path = `/profile/exercises?planId=${item.id}`;
    } else if ("artist" in item) {
      // It's a song
      path = `/timer/song/${item.id}`;
    } else {
      // It's a single exercise
      path = `/profile/exercises?exerciseId=${item.id}`;
    }
    router.push(path);
  };

  return (
    <div className="w-full relative mb-8 bg-zinc-800/40 rounded-xl p-4 lg:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-sm bg-second-400/10 flex items-center justify-center ">
            <Calendar className="text-zinc-400" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-200 tracking-wider">
              Your Week
            </h3>
            <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">
              {formatWeekRange(weekStartDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Timeline */}
      <div 
        ref={scrollContainerRef}
        className="relative overflow-x-auto pb-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 transition-colors z-10 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        <div className="relative min-w-[1200px] lg:min-w-full pb-4">
          
          {/* Timeline Track - Background Line */}
          <div className="absolute top-[85px] left-0 right-0 h-[1px] bg-second-400/10" />

          {/* Day Markers and Cards */}
          <div className="grid grid-cols-7 relative gap-1 pt-1">
            {weekDays.map((date, idx) => {
              const dayKey = getDayOfWeekKey(date);
              const active = isToday(date);
              const items = getItemsForDay(dayKey);
              const allDone = items.length > 0 && items.every((i: any) => i.completed);

              return (
                <div key={dayKey} className={`flex flex-col items-center relative group/day rounded-2xl transition-all duration-300  ${
                  allDone
                    ? 'bg-emerald-500/[0.04]'
                    : active
                      ? ''
                      : 'border-transparent hover:bg-white/[0.02]'
                }`}>

                  {/* Top Label (Day & Date) */}
                  <div className="flex flex-col items-center justify-end pb-4 pt-4 w-full">
                    <span className={` text-[10px] font-black tracking-[0.2em] mb-1 ${
                      active ? 'text-main' : 'text-zinc-400'
                    }`}>
                      {format(date, 'EEE')}
                    </span>
                    <span className={` leading-none transition-all ${
                       active ? 'text-4xl text-white' : 'text-3xl text-zinc-400 group-hover/day:text-zinc-300'
                    }`}>
                      {format(date, 'dd')}
                    </span>
                  </div>

                  {/* Timeline Node */}
                  <div className="relative h-[40px] flex items-center justify-center w-full z-10">
                    <div className={`relative z-20 rounded-full flex items-center justify-center transition-all ${
                      allDone
                        ? 'w-3 h-3 bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.35)]'
                        : active
                          ? 'w-3 h-3 bg-main shadow-[0_0_8px_2px_rgba(8,145,178,0.4)]'
                          : 'w-2 h-2 bg-zinc-700 group-hover/day:bg-zinc-500'
                    }`} />
                  </div>

                  {/* Cards Area */}
                  <div className="w-full px-2 pt-2 pb-3 flex flex-col gap-2 h-full">
                    {items.map((item: any, itemIdx) => (
                      <motion.div
                        key={`${dayKey}-${item.id}-${itemIdx}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: itemIdx * 0.05 }}
                        className="w-full"
                      >
                        <div className={`
                          group/card relative flex flex-col p-2 rounded-sm transition-all duration-100 cursor-default
                          ${item.completed
                            ? 'bg-emerald-500/10 opacity-70'
                            : active
                              ? 'bg-zinc-800/60 ring-1 ring-white/10 hover:bg-zinc-800/80'
                              : 'bg-zinc-900/60 ring-1 ring-white/[0.06] hover:bg-zinc-800/50 hover:ring-white/10'
                          }
                        `}>
                           <div className="flex flex-col justify-center relative z-10 pr-6 min-h-[28px]">
                             <div className="flex items-center gap-1.5 min-w-0 mb-0.5">
                               <div className={`shrink-0 flex items-center justify-center transition-colors ${
                                 item.completed ? 'text-emerald-400' : 'text-zinc-400'
                               }`}>
                                 {item.completed ? <Check size={13} strokeWidth={3} /> : ("artist" in item ? <Music size={12} /> : <TrendingUp size={12} />)}
                               </div>
                               <h4 className={`text-[11px] font-bold truncate tracking-tight transition-all ${
                                 item.completed ? 'text-emerald-400/80 line-through' : 'text-zinc-200'
                               }`}>
                                 {item.title?.en || item.title || "Untitled"}
                               </h4>
                             </div>
                             <p className={`text-[9px] font-semibold truncate uppercase pl-[17px] tracking-wider ${
                               item.completed ? 'text-emerald-500/50' : 'text-zinc-500'
                             }`}>
                               {"artist" in item ? item.artist : "Training Plan"}
                             </p>
                           </div>

                           <div className="absolute top-1/2 -translate-y-1/2 right-1.5 flex flex-row items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-all z-20 bg-zinc-900 p-0.5 rounded-lg  shadow-lg">
                             {!item.completed && (
                               <button
                                 onClick={(e) => { e.stopPropagation(); handlePlayTask(item); }}
                                 className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-md transition-all"
                                 title="Start Task"
                               >
                                 <Play size={11} className="fill-current" />
                               </button>
                             )}
                             <button
                               onClick={(e) => { e.stopPropagation(); handleToggleCompleted(dayKey, item.scheduleItemId || item.id, item.completed); }}
                               className={`p-1.5 rounded-md transition-all ${item.completed ? 'text-emerald-500 hover:text-white' : 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                             >
                               <Check size={11} strokeWidth={2.5} />
                             </button>
                             <button
                               onClick={(e) => { e.stopPropagation(); handleRemoveItem(dayKey, item.scheduleItemId || item.id); }}
                               className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-white/[0.06] rounded-md transition-all"
                             >
                               <X size={11} />
                             </button>
                           </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Add Button */}
                    <button
                      onClick={() => { setSelectedDayToAdd(dayKey); setIsSelectorOpen(true); }}
                      className={`
                        w-full h-9 mt-1 rounded-sm  flex items-center justify-center gap-1.5 transition-all group/add border
                        ${active
                          ? ' text-zinc-400 hover:border-main/40 hover:text-white hover:bg-main/5'
                          : 'border-white/[0.06] text-zinc-500 hover:border-white/15 hover:text-zinc-300 hover:bg-white/[0.02]'
                        }
                      `}
                    >
                      <Plus size={12} className="transition-transform group-hover/add:scale-110" />
                      <span className="text-[12px] tracking-[0.18em]">Add</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ScheduleItemSelector
        isOpen={isSelectorOpen}
        onClose={() => { setIsSelectorOpen(false); setSelectedDayToAdd(null); }}
        onSelectPlan={handleSelectItem}
        onSelectSong={handleSelectItem}
        userSongs={userSongs}
        userPlans={userPlans}
      />
    </div>
  );
};
