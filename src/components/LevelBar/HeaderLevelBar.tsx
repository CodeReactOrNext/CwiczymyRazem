import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { getPointsToLvlUp } from "utils/gameLogic/getPointsToLvlUp";

interface HeaderLevelBarProps {
  points: number;
  lvl: number;
  className?: string;
}

export const HeaderLevelBar = ({ points, lvl, className }: HeaderLevelBarProps) => {
  const currentLvlPoints = getPointsToLvlUp(lvl - 1);
  const nextLvlPoints = getPointsToLvlUp(lvl);
  const pointsInCurrentLvl = points - currentLvlPoints;
  const pointsNeededForNextLvl = nextLvlPoints - currentLvlPoints;
  const progressPercent = Math.min(Math.max((pointsInCurrentLvl / pointsNeededForNextLvl) * 100, 0), 100);

  return (
    <div className={cn("flex h-10 items-center gap-3 rounded-lg bg-zinc-800/40 px-3 py-2 shadow-sm backdrop-blur-sm", className)}>
      {/* Level Badge - Simple & Clean */}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-500">
        <span className="text-[11px] font-black">{lvl}</span>
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-zinc-500">
            <Zap size={10} className="fill-current" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Progress</span>
          </div>
          <span className="text-[10px] font-black text-white/90">{Math.floor(progressPercent)}%</span>
        </div>
        
        {/* Simple Flat Progress Bar */}
        <div className="relative h-1 w-28 overflow-hidden rounded-full bg-zinc-950/60">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-cyan-500"
          />
        </div>
      </div>
    </div>
  );
};
