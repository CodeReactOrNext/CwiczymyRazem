import { getPointsToLvlUp } from "utils/gameLogic";

interface LevelProgressHeroProps {
  lvl: number;
  points: number;
  className?: string;
}

export const LevelProgressHero = ({
  lvl,
  points,
  className = "",
}: LevelProgressHeroProps) => {
  const lvlXpStart = getPointsToLvlUp(lvl - 1);
  const lvlXpEnd = getPointsToLvlUp(lvl);
  
  let effectivePts = points;
  if (points < lvlXpStart && lvl > 1) effectivePts += lvlXpStart;
  
  const ptsInLevel = Math.max(0, effectivePts - lvlXpStart);
  const lvlRange = Math.max(1, lvlXpEnd - lvlXpStart);
  const xpPercent = Math.min(Math.max((ptsInLevel / lvlRange) * 100, 0), 100);

  return (
    <div className={`flex flex-col gap-2 w-full md:max-w-xl ${className}`}>
      <div className="flex items-baseline gap-3 leading-none">
        <span className="font-teko text-5xl font-medium text-white tracking-tight leading-none">
          Lvl {lvl}
        </span>
        <div className="h-4 w-[1px] bg-white/10 mx-0.5 self-center hidden md:block" />
        <span className="font-inter text-xl font-bold text-zinc-600 tracking-tight leading-none">
          {Math.round(xpPercent)}%
        </span>
      </div>

      <div className="relative h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
        <div 
          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all duration-1000 ease-out" 
          style={{ width: `${xpPercent}%` }} 
        />
      </div>

      <div className="flex justify-between items-center text-[11px] font-medium text-zinc-500 font-inter">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">{ptsInLevel.toLocaleString()}</span>
          <span className="text-zinc-800">/</span>
          <span>{lvlRange.toLocaleString()} xp</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-zinc-800" />
          <span className="text-zinc-600">Level {lvl + 1}</span>
        </div>
      </div>
    </div>
  );
};




