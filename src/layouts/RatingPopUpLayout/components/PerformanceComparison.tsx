import { Card } from "assets/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { convertMsToHM } from "utils/converter";

interface PerformanceComparisonProps {
  todayTime: number;
  activityData?: {
    date: string;
    techniqueTime: number;
    theoryTime: number;
    hearingTime: number;
    creativityTime: number;
  }[];
}

export function PerformanceComparison({ todayTime, activityData = [] }: PerformanceComparisonProps) {
  const last7Days = activityData.slice(-7);
  
  const avgTime = last7Days.length > 0
    ? last7Days.reduce((acc, day) => 
        acc + day.techniqueTime + day.theoryTime + day.hearingTime + day.creativityTime, 0
      ) / last7Days.length
    : 0;

  const bestTime = last7Days.length > 0
    ? Math.max(...last7Days.map(day => 
        day.techniqueTime + day.theoryTime + day.hearingTime + day.creativityTime
      ))
    : 0;

  const avgDiff = avgTime > 0 ? ((todayTime - avgTime) / avgTime) * 100 : 0;
  const bestDiff = bestTime > 0 ? ((todayTime - bestTime) / bestTime) * 100 : 0;

  const getIcon = (diff: number) => {
    if (diff > 5) return <TrendingUp className='h-3.5 w-3.5 text-green-400' />;
    if (diff < -5) return <TrendingDown className='h-3.5 w-3.5 text-orange-400' />;
    return <Minus className='h-3.5 w-3.5 text-gray-400' />;
  };

  const getColor = (diff: number) => {
    if (diff > 5) return 'text-green-400';
    if (diff < -5) return 'text-orange-400';
    return 'text-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}>
      <Card className='border-white/10 bg-zinc-900/50 backdrop-blur-sm'>
        <div className='p-3'>
          <h3 className='mb-2 text-sm font-semibold text-white'>
            Performance <span className="text-xs font-normal text-gray-400">(Practice Time)</span>
          </h3>
          
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between text-xs'>
              <span className='text-gray-400'>vs 7-day avg</span>
              <div className='flex items-center gap-1.5'>
                {getIcon(avgDiff)}
                <span className={`font-bold ${getColor(avgDiff)}`}>
                  {avgDiff > 0 ? '+' : ''}{avgDiff.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className='flex items-center justify-between text-xs'>
              <span className='text-gray-400'>vs best day</span>
              <div className='flex items-center gap-1.5'>
                {getIcon(bestDiff)}
                <span className={`font-bold ${getColor(bestDiff)}`}>
                  {bestDiff > 0 ? '+' : ''}{bestDiff.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
