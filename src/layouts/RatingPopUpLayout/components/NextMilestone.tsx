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
  const pointsNeeded = pointsToNextLevel - currentPoints;

  const currentStreak = currentUserStats.actualDayWithoutBreak;
  const nextStreakMilestone = 
    currentStreak < 3 ? 3 :
    currentStreak < 7 ? 7 :
    currentStreak < 14 ? 14 :
    currentStreak < 30 ? 30 :
    currentStreak < 50 ? 50 :
    currentStreak < 100 ? 100 : currentStreak + 50;
  
  const daysToStreakMilestone = nextStreakMilestone - currentStreak;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}>
      <Card className='border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 backdrop-blur-sm'>
        <div className='p-3'>
          <div className='mb-2 flex items-center gap-2'>
            <Target className='h-4 w-4 text-cyan-400' />
            <h3 className='text-sm font-semibold text-white'>Next Milestones</h3>
          </div>
          
          <div className='space-y-2.5'>
            <div>
              <div className='mb-1 flex items-center justify-between text-xs'>
                <span className='text-gray-400'>Level {currentLevel + 1}</span>
                <span className='font-bold text-cyan-400'>{pointsNeeded} pts to go</span>
              </div>
              <div className='relative h-2 overflow-hidden rounded-full bg-zinc-800/50'>
                <motion.div
                  initial={{ width: `${Math.max(0, progressToNextLevel - 10)}%` }}
                  animate={{ width: `${progressToNextLevel}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className='absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400'
                />
              </div>
            </div>

            {daysToStreakMilestone > 0 && (
              <div className='flex items-center gap-2 rounded-md bg-white/5 p-2'>
                <Zap className='h-3.5 w-3.5 text-orange-400' />
                <span className='flex-1 text-xs text-gray-300'>
                  <span className='font-bold text-white'>{daysToStreakMilestone}</span> more days to {nextStreakMilestone}-day streak 🔥
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
