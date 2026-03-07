import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pin, Music, TrendingUp, Info } from 'lucide-react';

interface TodayTimelineProps {
  items: any[];
  isLoading?: boolean;
}

export const TodayTimeline = ({ items, isLoading }: TodayTimelineProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const hours = useMemo(() => {
    const arr = [];
    for (let i = 8; i <= 20; i++) {
       arr.push(`${String(i).padStart(2, '0')}:00`);
       arr.push(`${String(i).padStart(2, '0')}:30`);
    }
    return arr;
  }, []);

  const currentTime = useMemo(() => {
    const now = new Date();
    return formatTime(now);
  }, []);

  function formatTime(date: Date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${String(hours).padStart(2, '0')}:${minutes < 30 ? '00' : '30'}`;
  }

  const currentHourIndex = hours.indexOf(currentTime);
  const indicatorPosition = currentHourIndex !== -1 ? (currentHourIndex * 80) + 40 : 0;

  useEffect(() => {
    if (scrollContainerRef.current && currentHourIndex !== -1) {
       scrollContainerRef.current.scrollLeft = Math.max(0, indicatorPosition - 200);
    }
  }, [currentHourIndex, indicatorPosition]);

  const timelineItems = useMemo(() => {
    return items.map((item, index) => {
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
  }, [items, hours]);

  if (isLoading) {
    return (
      <div className="w-full h-[300px] bg-zinc-900/40 rounded-[2.5rem] animate-pulse flex items-center justify-center">
         <div className="text-zinc-500 font-bold uppercase tracking-widest">Wczytywanie osi czasu...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-10">
        <Pin className="text-rose-500 fill-rose-500 -rotate-45" size={18} />
        <h3 className="text-lg font-bold text-white tracking-tight">Today&apos;s Timeline</h3>
      </div>

      {/* Timeline Container */}
      <div 
        ref={scrollContainerRef}
        className="relative overflow-x-auto no-scrollbar pb-6"
        style={{ cursor: 'grab' }}
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
                  hour === currentTime ? 'text-main' : 'text-zinc-600'
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
          {currentHourIndex !== -1 && (
            <div 
              className="absolute top-0 bottom-0 w-[2px] bg-main z-10 transition-all duration-1000"
              style={{ left: indicatorPosition }}
            >
              <div className="absolute top-[28px] left-1/2 -translate-x-1/2 w-3 h-4 bg-main rounded-b-sm" />
            </div>
          )}

          {/* Task Cards */}
          <div className="absolute top-16 left-0 right-0 flex pointer-events-none">
            {timelineItems.map((item, idx) => (
              <motion.div
                key={`${item.id}-${idx}`}
                className="absolute pointer-events-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                style={{ left: item.position - 100, width: 200 }}
              >
                <div className={`
                  group relative flex flex-col p-5 rounded-[2rem] bg-[#161616] border border-white/5 
                  hover:border-white/10 hover:bg-[#1a1a1a] transition-all duration-300 shadow-xl
                  ${item.time === currentTime ? 'ring-2 ring-main/20' : ''}
                `}>
                  {/* Time Badge */}
                  <div className={`
                    self-start px-3 py-1 rounded-full mb-4 text-[10px] font-bold 
                    ${item.time === currentTime ? 'bg-main text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'}
                  `}>
                    {item.time} {Number(item.time.split(':')[0]) < 12 ? 'AM' : 'PM'}
                  </div>

                  <h4 className="text-[14px] font-black text-white mb-2 line-clamp-1">
                    {item.title?.en || item.title || "Activity"}
                  </h4>
                  
                  <p className="text-[11px] font-medium text-zinc-500 mb-4 line-clamp-2 leading-relaxed">
                    {item.isSong ? `Dobra robota! Ćwicz utwór ${item.artist}.` : "Dokończ zaplanowany trening dzisiaj."}
                  </p>

                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-[#161616] flex items-center justify-center text-[10px] font-bold text-zinc-500">
                       {item.isSong ? <Music size={10} /> : <TrendingUp size={10} />}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {timelineItems.length === 0 && (
               <div className="absolute left-[80px] top-6 flex items-center gap-4 p-6 rounded-[2rem] bg-zinc-900/20 border border-dashed border-white/5">
                  <div className="p-3 rounded-2xl bg-white/5 text-zinc-500">
                    <Info size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-400">Brak zadań na dzisiaj</span>
                    <span className="text-[10px] text-zinc-600">Dodaj coś do planera, aby zobaczyć oś czasu.</span>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
