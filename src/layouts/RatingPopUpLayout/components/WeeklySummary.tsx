import { Card } from "assets/components/ui/card";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { convertMsToHM } from "utils/converter";

interface WeeklySummaryProps {
  activityData?: {
    date: string;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }[];
}

export function WeeklySummary({ activityData = [] }: WeeklySummaryProps) {
  const last7Days = activityData.slice(-7);
  
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const daysWithData = weekDays.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = last7Days.find(d => {
      const activityDate = new Date(d.date).toISOString().split('T')[0];
      return activityDate === dateStr;
    });
    
    const totalTime = dayData 
      ? dayData.techniqueTime + dayData.theoryTime + dayData.hearingTime + dayData.creativityTime
      : 0;
    
    return {
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      hasData: totalTime > 0,
      isToday: dateStr === today.toISOString().split('T')[0],
      totalTime,
    };
  });

  const completedDays = daysWithData.filter(d => d.hasData).length;
  const totalWeekTime = daysWithData.reduce((acc, d) => acc + d.totalTime, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}>
      <Card className='border-white/10 bg-zinc-900/50 backdrop-blur-sm'>
        <div className='p-3'>
          <div className='mb-2 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-cyan-400' />
              <h3 className='text-sm font-semibold text-white'>This Week</h3>
            </div>
            <span className='text-xs text-gray-400'>
              {completedDays}/7 days • {convertMsToHM(totalWeekTime)}
            </span>
          </div>

          <div className='flex justify-between gap-1'>
            {daysWithData.map((day, index) => (
              <div key={index} className='flex flex-1 flex-col items-center gap-1'>
                <span className='text-xs text-gray-500'>{day.day}</span>
                <div
                  className={`flex h-8 w-full items-center justify-center rounded text-lg ${
                    day.isToday
                      ? 'bg-cyan-500/20 ring-2 ring-cyan-500/50'
                      : day.hasData
                      ? 'bg-cyan-500/10'
                      : 'bg-zinc-800/30'
                  }`}>
                  {day.hasData ? (
                    <span className='text-cyan-400'>✓</span>
                  ) : (
                    <span className='text-gray-600'>–</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
