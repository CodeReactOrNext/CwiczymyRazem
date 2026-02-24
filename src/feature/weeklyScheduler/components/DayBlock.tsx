import { Check, Plus, X, Music, TrendingUp, Play, Square, CheckSquare } from "lucide-react";
import { FaGuitar } from "react-icons/fa";
import type { DaySchedule } from "../types/weeklyScheduler.types";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { Song } from "feature/songs/types/songs.type";

interface DayBlockProps {
  dayName: string;
  daySchedule: DaySchedule;
  isToday: boolean;
  onClick: () => void;
  onClear: (e: React.MouseEvent) => void;
  onStart: (item: Exercise | ExercisePlan | Song) => void;
  onRemoveItem: (itemId: string) => void;
  onToggleItemComplete: (itemId: string, currentStatus: boolean) => void;
  selectedItems: (Exercise | ExercisePlan | Song)[];
  dayColor: string;
  isCollapsed?: boolean;
  isFuture?: boolean;
}

export const DayBlock = ({
  dayName,
  daySchedule,
  isToday,
  onClick,
  onClear,
  onStart,
  onRemoveItem,
  onToggleItemComplete,
  selectedItems,
  dayColor,
  isCollapsed = false,
  isFuture = false,
}: DayBlockProps) => {
  const hasSchedule = selectedItems.length > 0;
  const isCompleted = daySchedule.completed;

  const renderLocalized = (content: any) => {
    if (typeof content === "string") return content;
    if (content && typeof content === "object") {
      return content.en || content.pl || "";
    }
    return "";
  };

  const getDayColorClasses = (color: string) => {
    const colors: Record<string, { gradient: string; border: string; text: string; glow: string }> = {
      cyan: {
        gradient: "from-cyan-500/10 via-zinc-950/50 to-zinc-950",
        border: "border-cyan-500/20",
        text: "text-cyan-400",
        glow: "shadow-cyan-500/20",
      },
      emerald: {
        gradient: "from-emerald-500/10 via-zinc-950/50 to-zinc-950",
        border: "border-emerald-500/20",
        text: "text-emerald-400",
        glow: "shadow-emerald-500/20",
      },
      violet: {
        gradient: "from-violet-500/10 via-zinc-950/50 to-zinc-950",
        border: "border-violet-500/20",
        text: "text-violet-400",
        glow: "shadow-violet-500/20",
      },
      amber: {
        gradient: "from-amber-500/10 via-zinc-950/50 to-zinc-950",
        border: "border-amber-500/20",
        text: "text-amber-400",
        glow: "shadow-amber-500/20",
      },
      rose: {
        gradient: "from-rose-500/10 via-zinc-950/50 to-zinc-950",
        border: "border-rose-500/20",
        text: "text-rose-400",
        glow: "shadow-rose-500/20",
      },
      blue: {
        gradient: "from-blue-500/10 via-zinc-950/50 to-zinc-950",
        border: "border-blue-500/20",
        text: "text-blue-400",
        glow: "shadow-blue-500/20",
      },
      fuchsia: {
        gradient: "from-fuchsia-500/10 via-zinc-950/50 to-zinc-950",
        border: "border-fuchsia-500/20",
        text: "text-fuchsia-400",
        glow: "shadow-fuchsia-500/20",
      },
    };
    return colors[color] || colors.cyan;
  };

  const colorClasses = getDayColorClasses(dayColor);

  if (isCollapsed) {
    return (
      <div
        onClick={onClick}
        className={`
          relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer
          ${isCompleted 
            ? "border-emerald-500/30 bg-emerald-500/5" 
            : isToday 
              ? `${colorClasses.border} bg-white/5` 
              : "border-border bg-zinc-800/40"
          }
        `}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`text-[10px] font-black tracking-widest ${isToday ? colorClasses.text : "text-zinc-400"}`}>
            {dayName.substring(0, 3)}
          </div>
          <div className="flex-1 min-w-0">
            {hasSchedule ? (
              <p className={`text-xs font-bold truncate ${isCompleted ? "text-emerald-400" : "text-white/70"}`}>
                {selectedItems.length > 1 ? `${selectedItems.length} Tasks` : renderLocalized(selectedItems[0].title)}
              </p>
            ) : (
              <p className="text-[10px] text-zinc-400 font-bold  tracking-wider">Rest Day</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isToday && !isCompleted && <div className={`h-1 w-1 rounded-full animate-pulse ${colorClasses.text.replace("text-", "bg-")}`} />}
          {isCompleted ? (
            <Check size={14} className="text-emerald-500" strokeWidth={3} />
          ) : hasSchedule && !isFuture ? (
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="relative group h-full">
      <div
        onClick={onClick}
        className={`
       relative flex flex-col overflow-hidden 
          rounded-xl border cursor-pointer group/card
          ${isCompleted 
            ? "border-emerald-500/10 bg-zinc-800/40" 
            : isToday 
              ? `border-transparent ring-1 ring-white/10 ${colorClasses.gradient} bg-zinc-800/40` 
              : "border-transparent bg-zinc-800/40 hover:bg-zinc-800/20"
          }
          p-4 min-h-[160px] md:min-h-[180px] transition-all duration-300
        `}
      >
        {isCompleted && (
          <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none rotate-12">
            <Check size={120} strokeWidth={4} className="text-emerald-500" />
          </div>
        )}

        <div className="flex items-center justify-between mb-3 relative z-10 w-full shrink-0">
          <h3 className={`text-[12px] font-bold tracking-tight
            ${isCompleted ? "text-emerald-400" : isToday ? colorClasses.text : "text-zinc-300"}
          `}>
            {dayName}
          </h3>
          <div className="flex items-center gap-2">
            {isToday && !isCompleted && (
              <div className="relative flex h-2 w-2">
                <div className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${colorClasses.text.replace("text-", "bg-")}`} />
                <div className={`relative inline-flex h-2 w-2 rounded-full ${colorClasses.text.replace("text-", "bg-")}`} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col relative z-10 w-full space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-1">
          {hasSchedule ? (
            <>
              {selectedItems.map((item, idx) => {
                const itemEntry = daySchedule.items?.find(i => i.id === item.id);
                // Fallback for legacy items before items array migration
                const itemCompleted = itemEntry?.completed || (daySchedule.items?.length === 0 && daySchedule.completed);

                return (
                  <div key={`${item.id}-${idx}`} className="group/item flex flex-col gap-1.5 py-2 last:border-b-0 relative">
                    {/* Top part - info */}
                    <div className="flex items-start gap-2 w-full">
                      {("coverUrl" in item && (item as any).coverUrl) ? (
                        <div className="w-6 h-6 shrink-0 rounded-[4px] overflow-hidden bg-zinc-900 mt-0.5">
                          <img src={(item as any).coverUrl} alt="" className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 transition-opacity" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 shrink-0 rounded-[4px] bg-white/5 flex items-center justify-center mt-0.5">
                          {"artist" in item ? <Music size={12} className="text-zinc-400" /> : <TrendingUp size={12} className="text-zinc-400" />}
                        </div>
                      )}
                      
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <h4 className={`text-xs sm:text-sm font-semibold leading-snug transition-colors ${itemCompleted ? "text-emerald-500 line-through opacity-60" : "text-zinc-200 group-hover/item:text-white"}`}>
                          {renderLocalized(item.title)}
                        </h4>
                        {"artist" in item && !itemCompleted && (
                          <span className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 truncate">{(item as Song).artist}</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom part - actions */}
                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 transition-opacity pt-1">
                      {isToday && !itemCompleted && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onStart(item); }} 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 transition-all rounded-md text-[10px] font-bold uppercase tracking-wider mr-auto"
                          title="Start Practice"
                        >
                          <Play size={10} fill="currentColor" /> Start
                        </button>
                      )}
                      
                      {!isFuture && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onToggleItemComplete(item.id, !!itemCompleted); 
                          }} 
                          className={`p-2 rounded-md transition-all transform hover:scale-105 ${
                            itemCompleted 
                              ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20" 
                              : "text-zinc-400 bg-zinc-800/40 hover:text-emerald-400 hover:bg-zinc-800/80"
                          }`}
                          title={itemCompleted ? "Mark incomplete" : "Mark complete"}
                        >
                          {itemCompleted ? <CheckSquare size={16} strokeWidth={2.5} /> : <Square size={16} strokeWidth={2} />}
                        </button>
                      )}
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }} 
                        className="p-2 text-zinc-400 bg-zinc-800/40 hover:text-rose-400 transition-all transform hover:scale-105 hover:bg-zinc-800/80 rounded-md"
                        title="Remove Task"
                      >
                        <X size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              <div 
                className="mt-2 flex items-center justify-center gap-1.5 p-2 rounded-md border border-dashed border-white/10 hover:border-white/20 text-zinc-500 hover:text-zinc-300 transition-all mx-0.5 opacity-0 group-hover/card:opacity-40 hover:!opacity-100"
              >
                <Plus size={14} /> <span className="text-[10px] font-bold uppercase tracking-wider">Add Task</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[100px] rounded-xl border-2 border-dashed border-border bg-transparent hover:bg-zinc-800/30 hover:border-zinc-600 transition-all group/empty">
              <div className="bg-zinc-800/50 p-2 rounded-full mb-1.5 group-hover/empty:bg-zinc-700/50 transition-colors">
                <Plus size={14} className="text-zinc-400 group-hover/empty:text-zinc-300" />
              </div>
              <span className="text-[9px] font-black tracking-widest text-zinc-400 group-hover/empty:text-zinc-300">Add Tasks</span>
            </div>
          )}
        </div>
        
        {hasSchedule && isCompleted && (
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[9px] uppercase tracking-wider mt-2 relative z-10 pt-2 border-t border-emerald-500/10 shrink-0">
            <Check size={10} strokeWidth={3} />
            All Tasks Completed
          </div>
        )}
      </div>
    </div>
  );
};

