import { Card } from "assets/components/ui/card";
import { motion } from "framer-motion";
import { Target, Zap } from "lucide-react";
import type { StatisticsDataInterface } from "types/api.types";
import { getPointsToLvlUp } from "utils/gameLogic";

interface NextMilestoneProps {
  currentUserStats: StatisticsDataInterface;
  pointsGained: number;
}

export function NextMilestone({ currentUserStats, pointsGained }: NextMilestoneProps) {
  const currentPoints = currentUserStats.points;
  const currentLevel = currentUserStats.lvl;
  const pointsToNextLevel = getPointsToLvlUp(currentLevel);
  const progressToNextLevel = (currentPoints / pointsToNextLevel) * 100;
  const pointsRemaining = pointsToNextLevel - currentPoints;

  const currentStreakCount = currentUserStats.actualDayWithoutBreak;
  const nextStreakTarget = 
    currentStreakCount < 3 ? 3 :
    currentStreakCount < 7 ? 7 :
    currentStreakCount < 14 ? 14 :
    currentStreakCount < 30 ? 30 :
    currentStreakCount < 50 ? 50 :
    currentStreakCount < 100 ? 100 : currentStreakCount + 50;
  
  const daysUntilNextStreak = nextStreakTarget - currentStreakCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}>
      <Card className='border-none bg-zinc-900/40 backdrop-blur-xl rounded-lg'>
        <div className='p-6'>
          <div className='mb-4 flex items-center gap-3'>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Target className='h-4 w-4 text-cyan-400' />
            </div>
            <h3 className='text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500'>Next Objectives</h3>
          </div>
           
          <div className='space-y-6'>
            <div>
              <div className='mb-2 flex items-center justify-between text-xs'>
                <span className='font-bold text-zinc-400 uppercase tracking-tight'>LEVEL {currentLevel + 1}</span>
                <span className='font-black text-white tabular-nums'>{pointsRemaining} XP required</span>
              </div>
              <div className='relative h-2.5 overflow-hidden rounded-full bg-white/5'>
                <motion.div
                  initial={{ width: `${Math.max(0, progressToNextLevel - 10)}%` }}
                  animate={{ width: `${progressToNextLevel}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className='absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400'
                />
              </div>
            </div>

        
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
