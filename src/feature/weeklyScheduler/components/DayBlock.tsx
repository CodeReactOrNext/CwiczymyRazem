import { Check, Plus, X, Music, TrendingUp } from "lucide-react";
import { FaGuitar } from "react-icons/fa";
import type { DaySchedule } from "../types/weeklyScheduler.types";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { Song } from "feature/songs/types/songs.type";

interface DayBlockProps {
  dayName: string;
  daySchedule: DaySchedule;
  isToday: boolean;
  onClick: () => void;
  onToggleComplete: (e: React.MouseEvent) => void;
  onClear: (e: React.MouseEvent) => void;
  onStart: (e: React.MouseEvent) => void;
  selectedItem?: Exercise | ExercisePlan | Song;
  dayColor: string;
  isCollapsed?: boolean;
}

export const DayBlock = ({
  dayName,
  daySchedule,
  isToday,
  onClick,
  onToggleComplete,
  onClear,
  onStart,
  selectedItem,
  dayColor,
  isCollapsed = false,
}: DayBlockProps) => {
  const hasSchedule = !!(daySchedule.planId || daySchedule.exerciseId || daySchedule.songId);
  const isCompleted = daySchedule.completed;

  const renderLocalized = (content: any) => {
    if (typeof content === "string") return content;
    if (content && typeof content === "object") {
      return content.en || content.pl || "";
    }
    return "";
  };

  const getItemIcon = () => {
    if (!selectedItem) return null;
    if ("exercises" in selectedItem) return TrendingUp;
    if ("artist" in selectedItem) return Music;
    return FaGuitar;
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
          relative flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer
          ${isCompleted 
            ? "border-emerald-500/30 bg-emerald-500/5" 
            : isToday 
              ? `${colorClasses.border} bg-white/5` 
              : "border-white/5 bg-zinc-950/20"
          }
        `}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`text-[10px] font-black uppercase tracking-widest ${isToday ? colorClasses.text : "text-zinc-500"}`}>
            {dayName.substring(0, 3)}
          </div>
          <div className="flex-1 min-w-0">
            {hasSchedule && selectedItem ? (
              <p className={`text-xs font-bold truncate ${isCompleted ? "text-emerald-400" : "text-white/70"}`}>
                {renderLocalized(selectedItem.title)}
              </p>
            ) : (
              <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider">Rest Day</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isToday && !isCompleted && <div className={`h-1 w-1 rounded-full animate-pulse ${colorClasses.text.replace("text-", "bg-")}`} />}
          {isCompleted ? (
            <Check size={14} className="text-emerald-500" strokeWidth={3} />
          ) : hasSchedule ? (
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
          relative flex flex-col justify-between overflow-hidden 
          rounded-lg border transition-all duration-500 cursor-pointer
          ${isCompleted 
            ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
            : isToday 
              ? `${colorClasses.border} ${colorClasses.gradient} ring-1 ring-white/10 shadow-2xl` 
              : "border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60"
          }
          p-4 min-h-[140px] md:min-h-[160px]
        `}
      >
        {/* Background Checkmark for Completed State */}
        {isCompleted && (
          <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
            <Check size={120} strokeWidth={3} className="text-emerald-500" />
          </div>
        )}

        <div className="flex items-center justify-between mb-3 relative z-10 w-full">
          <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] 
            ${isCompleted ? "text-emerald-400" : isToday ? colorClasses.text : "text-zinc-500"}
          `}>
            {dayName}
          </h3>
          <div className="flex items-center gap-2">
            {isToday && !isCompleted && (
              <div className="relative flex h-1.5 w-1.5">
                <div className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${colorClasses.text.replace("text-", "bg-")}`} />
                <div className={`relative inline-flex h-1.5 w-1.5 rounded-full ${colorClasses.text.replace("text-", "bg-")}`} />
              </div>
            )}
            {hasSchedule && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleComplete(e); }} 
                  className={`p-1.5 rounded transition-all ${isCompleted ? "text-emerald-400 hover:bg-emerald-500/10" : "text-zinc-600 hover:text-white hover:bg-white/10"}`}
                  title={isCompleted ? "Mark incomplete" : "Mark complete"}
                >
                  <Check size={14} strokeWidth={isCompleted ? 3 : 2} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onClear(e); }} 
                  className="p-1.5 hover:bg-white/10 rounded text-zinc-600 hover:text-white"
                  title="Clear day"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center relative z-10 w-full space-y-3">
          {hasSchedule && selectedItem ? (
            <>
              <div className="flex items-start gap-4">
                {("coverUrl" in selectedItem && (selectedItem as any).coverUrl) && (
                  <div className="w-12 h-12 shrink-0 rounded overflow-hidden border border-white/10 shadow-lg">
                    <img src={(selectedItem as any).coverUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1 flex flex-col gap-1">
                  <h4 className={`text-[13px] font-bold leading-tight line-clamp-2 ${isCompleted ? "text-emerald-50 transition-colors" : "text-white"}`}>
                    {renderLocalized(selectedItem.title)}
                  </h4>
                  {"artist" in selectedItem && (
                    <p className="text-[11px] font-medium text-zinc-500 truncate mt-0.5">{(selectedItem as Song).artist}</p>
                  )}
                </div>
              </div>

              {isToday && !isCompleted && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onStart(e); }} 
                  className="w-full py-2 bg-white text-black rounded text-[10px] font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-auto"
                >
                  <FaGuitar className="h-3 w-3" /> Start Practice
                </button>
              )}

              {isCompleted && (
                <div className="flex items-center gap-1.5 text-emerald-400 font-black text-[9px] uppercase tracking-widest mt-auto">
                  <div className="h-1 w-1 rounded-full bg-emerald-400" />
                  Session Finished
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4 rounded border-2 border-dashed border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
              <Plus size={18} className="text-zinc-700" />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Add Schedule</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

