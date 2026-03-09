import { Plus, Music, TrendingUp, X, Check } from "lucide-react";
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
  
  const renderLocalized = (content: any) => {
    if (typeof content === "string") return content;
    if (content && typeof content === "object") {
      return content.en || content.pl || "";
    }
    return "";
  };

  return (
    <div 
      onClick={onClick}
      className={`relative flex flex-col p-5 rounded-[2rem] transition-all duration-500 cursor-pointer min-h-[220px] isolate ${
        isToday 
          ? 'bg-zinc-800/40 ring-1 ring-white/10 shadow-2xl' 
          : 'bg-zinc-900/40 ring-1 ring-white/5 hover:bg-zinc-800/60'
      }`}
    >
      {/* Today Indicator Dot */}
      {isToday && (
        <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-main animate-pulse" />
      )}

      {/* Day Name */}
      <h3 className={`text-[12px] font-black uppercase tracking-[0.2em] mb-6 transition-colors ${
        isToday ? 'text-main' : 'text-zinc-500 group-hover:text-zinc-400'
      }`}>
        {dayName}
      </h3>

      {/* Content Area */}
      <div className="flex-1 flex flex-col gap-2.5">
        {hasSchedule ? (
          <>
            {selectedItems.map((item, idx) => {
              const isSong = "artist" in item;
              const isPlan = "exercises" in item;
              const itemEntry = daySchedule.items?.find(i => i.id === item.id);
              const itemCompleted = itemEntry?.completed || (daySchedule.items?.length === 0 && daySchedule.completed);
              
              return (
                <div 
                  key={`${item.id}-${idx}`}
                  className={`group/item relative flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-all ${
                    itemCompleted ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-zinc-500 group-hover/item:text-zinc-300">
                    {isSong ? <Music size={14} /> : <TrendingUp size={14} />}
                  </div>
                  
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-[11px] font-bold text-zinc-100 truncate tracking-tight transition-all ${
                       itemCompleted ? 'line-through' : ''
                    }`}>
                      {renderLocalized(item.title)}
                    </span>
                    {!itemCompleted && (
                       <span className="text-[9px] font-medium text-zinc-600 truncate uppercase tracking-tighter">
                        {isSong ? (item as Song).artist : isPlan ? "Training Plan" : "Exercise"}
                       </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onToggleItemComplete(item.id, !!itemCompleted);
                      }}
                      className={`p-1 transition-colors ${itemCompleted ? 'text-main' : 'text-zinc-600 hover:text-white'}`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                      className="p-1 text-zinc-600 hover:text-rose-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            
            <div className="mt-auto flex justify-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <Plus size={16} className="text-zinc-500 hover:text-white" />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-white/5 bg-transparent hover:border-white/10 transition-all gap-2 group/empty">
             <div className="p-1.5 rounded-full bg-zinc-800/20 text-zinc-600 group-hover/empty:text-zinc-400">
               <Plus size={14} />
             </div>
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 group-hover/empty:text-zinc-400">
               Add Tasks
             </span>
          </div>
        )}
      </div>
    </div>
  );
};

