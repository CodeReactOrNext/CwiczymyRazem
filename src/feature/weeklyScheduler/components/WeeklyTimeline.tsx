import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Music, TrendingUp, Info } from 'lucide-react';
import { format } from 'date-fns';
import { getDayOfWeekKey } from '../utils/dateUtils';
import type { DayOfWeek } from '../types/weeklyScheduler.types';

interface WeeklyTimelineProps {
  weeklyData: Record<string, any[]> | null;
  weekDays: Date[];
  isLoading?: boolean;
}

export const WeeklyTimeline = ({ weeklyData, weekDays, isLoading }: WeeklyTimelineProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<DayOfWeek>(getDayOfWeekKey(new Date()));
  
  const hours = useMemo(() => {
    const arr = [];
    for (let i = 8; i <= 20; i++) {
       arr.push(`${String(i).padStart(2, '0')}:00`);
       arr.push(`${String(i).padStart(2, '0')}:30`);
    }
    return arr;
  }, []);

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${now.getMinutes() < 30 ? '00' : '30'}`;
  const isCurrentDaySelected = selectedDayKey === getDayOfWeekKey(now);

  const currentHourIndex = hours.indexOf(currentTime);
  const indicatorPosition = currentHourIndex !== -1 ? (currentHourIndex * 80) + 40 : 0;

  useEffect(() => {
    if (scrollContainerRef.current && isCurrentDaySelected && currentHourIndex !== -1) {
       scrollContainerRef.current.scrollLeft = Math.max(0, indicatorPosition - 200);
    } else if (scrollContainerRef.current) {
       scrollContainerRef.current.scrollLeft = 0;
    }
  }, [selectedDayKey, isCurrentDaySelected, currentHourIndex, indicatorPosition]);

  const itemsForSelectedDay = useMemo(() => {
    if (!weeklyData || !weeklyData[selectedDayKey]) return [];
    
    return weeklyData[selectedDayKey].map((item: any, index: number) => {
      const isSong = "artist" in item;
      const hourIdx = 2 + (index * 4); // Spread them out
      const timeStr = hours[hourIdx % hours.length];
      
      return {
        ...item,
        time: timeStr,
        position: (hourIdx * 80) + 40,
        isSong
      };
    });
  }, [weeklyData, selectedDayKey, hours]);

  if (isLoading) {
    return (
      <div className="w-full h-[350px] bg-zinc-900/40 rounded-[2.5rem] animate-pulse flex items-center justify-center">
         <div className="text-zinc-500 font-bold uppercase tracking-widest">Loading Timeline...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden mb-8">
      {/* Header & Day Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-2">
          <Pin className="text-rose-500 fill-rose-500 -rotate-45" size={18} />
          <h3 className="text-lg font-bold text-white tracking-tight">Weekly Timeline</h3>
        </div>

        {/* Horizontal Day Picker */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl ring-1 ring-white/5">
          {weekDays.map((date) => {
            const dayKey = getDayOfWeekKey(date);
            const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
            const isSelected = selectedDayKey === dayKey;
            
            return (
              <button
                key={dayKey}
                onClick={() => setSelectedDayKey(dayKey)}
                className={`
                  flex flex-col items-center justify-center w-12 py-2 rounded-xl transition-all
                  ${isSelected ? 'bg-white text-zinc-950 shadow-lg scale-105' : 'text-zinc-500 hover:text-white hover:bg-white/5'}
                `}
              >
                <span className="text-[9px] font-black uppercase tracking-widest mb-0.5">
                  {format(date, 'EEE')}
                </span>
                <span className="text-xs font-black">
                  {format(date, 'd')}
                </span>
                {isToday && !isSelected && (
                   <div className="mt-1 h-1 w-1 rounded-full bg-main" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Container */}
      <div 
        ref={scrollContainerRef}
        className="relative overflow-x-auto no-scrollbar pb-6"
      >
        <div className="relative min-w-[1200px] h-[220px]">
          {/* Time Labels */}
          <div className="flex mb-8">
            {hours.map((hour, idx) => (
              <div 
                key={hour} 
                className="w-[80px] shrink-0 text-center"
              >
                <span className={`text-[11px] font-bold transition-colors ${
                  isCurrentDaySelected && hour === currentTime ? 'text-main' : 'text-zinc-600'
                }`}>
                  {hour}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Lines */}
          <div className="absolute top-10 left-0 right-0 bottom-0 flex">
            {hours.map((hour) => (
              <div 
                key={`line-${hour}`}
                className="w-[80px] shrink-0 border-l border-dashed border-white/[0.03] h-full"
              />
            ))}
          </div>

          {/* Current Time Indicator Stripe */}
          {isCurrentDaySelected && currentHourIndex !== -1 && (
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-main z-10 transition-all duration-1000"
              style={{ left: indicatorPosition }}
            >
              <div className="absolute top-[28px] left-1/2 -translate-x-1/2 w-3 h-4 bg-main rounded-b-sm shadow-[0_0_10px_hsl(var(--main))]" />
            </div>
          )}

          {/* Task Cards */}
          <div className="absolute top-16 left-0 right-0 flex pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDayKey}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="contents"
              >
                {itemsForSelectedDay.map((item, idx) => (
                  <motion.div
                    key={`${item.id}-${idx}`}
                    className="absolute pointer-events-auto"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ left: item.position - 100, width: 200 }}
                  >
                    <div className={`
                      group relative flex flex-col p-5 rounded-[2rem] bg-[#161616] border border-white/5 
                      hover:border-white/10 hover:bg-[#222] transition-all duration-300 shadow-xl
                      ${isCurrentDaySelected && item.time === currentTime ? 'ring-2 ring-main/20 shadow-main/10' : ''}
                    `}>
                      {/* Time Badge */}
                      <div className={`
                        self-start px-3 py-1 rounded-full mb-4 text-[10px] font-bold 
                        ${isCurrentDaySelected && item.time === currentTime ? 'bg-main text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'}
                      `}>
                        {item.time} {Number(item.time.split(':')[0]) < 12 ? 'AM' : 'PM'}
                      </div>

                      <h4 className="text-[14px] font-black text-white mb-2 line-clamp-1 tracking-tight">
                        {item.title?.en || item.title || "Activity"}
                      </h4>
                      
                      <p className="text-[11px] font-medium text-zinc-500 mb-4 line-clamp-2 leading-relaxed">
                        {item.isSong ? `Practice time! Focus on ${item.artist}.` : "Keep up the great work on your plan today."}
                      </p>

                      <div className="flex items-center justify-between">
                         <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center">
                            {item.isSong ? <Music size={10} className="text-zinc-500" /> : <TrendingUp size={10} className="text-zinc-500" />}
                         </div>
                         <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                            {item.isSong ? "Song" : "Plan"}
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {itemsForSelectedDay.length === 0 && (
                   <div className="absolute left-[80px] top-6 flex items-center gap-4 p-6 rounded-[2.5rem] bg-zinc-900/10 border border-dashed border-white/5">
                      <div className="p-3 rounded-2xl bg-white/5 text-zinc-600">
                        <Info size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-500">No activities scheduled</span>
                        <span className="text-[10px] text-zinc-700 uppercase tracking-widest">Rest day or nothing planned yet.</span>
                      </div>
                   </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
