import { Card } from "assets/components/ui/card";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { StatisticsDataInterface } from "types/api.types";
import { getDailyStreakMultiplier } from "utils/gameLogic";

interface NextMilestoneProps {
  currentUserStats: StatisticsDataInterface;
}

export function NextMilestone({ currentUserStats }: NextMilestoneProps) {
  const currentStreakCount = currentUserStats.actualDayWithoutBreak;
  const multiplier = getDailyStreakMultiplier(currentStreakCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="h-full">
      <Card className='bg-zinc-900 border border-white/5 rounded-2xl h-full shadow-none'>
        <div className='p-6 flex flex-col justify-center h-full'>
          <div className='mb-4 flex items-center gap-2'>
            <Flame className='h-4 w-4 text-orange-500' />
            <h3 className='text-[11px] font-semibold text-zinc-500 uppercase tracking-widest'>Streak</h3>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-white tracking-tight">{currentStreakCount}</span>
            <span className="text-[11px] font-semibold text-zinc-500 tracking-widest uppercase">days</span>
          </div>

          {multiplier > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] font-bold text-orange-400">+{Math.round(multiplier * 100)}% XP</span>
              <span className="text-[10px] font-bold text-zinc-600 uppercase">bonus</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
