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
      transition={{ duration: 0.5, delay: 0.7 }}>
      <Card className='border-none bg-zinc-900/40 backdrop-blur-xl rounded-lg h-full'>
        <div className='p-6 flex flex-col justify-center h-full'>
          <div className='mb-4 flex items-center gap-3'>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Flame className='h-4 w-4 text-amber-500' />
            </div>
            <h3 className='text-sm font-semibold text-zinc-400'>Streak</h3>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-black text-white">{currentStreakCount}</span>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-tight">days</span>
          </div>

          {multiplier > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-black text-amber-400">+{Math.round(multiplier * 100)}% XP</span>
              <span className="text-[10px] font-bold text-zinc-600">bonus</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
