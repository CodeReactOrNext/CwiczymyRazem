import { cn } from "assets/lib/utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { Clock, Music2, Star, TrendingUp } from "lucide-react";

interface SkillPowerHeroProps {
  skillPower: number;
  playerTier: any;
  learnedCount: number;
  totalCount: number;
  totalPracticeMs?: number;
  className?: string;
}

const formatPracticeTime = (ms: number) => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const SkillPowerHero = ({
  skillPower,
  playerTier,
  learnedCount,
  totalCount,
  totalPracticeMs = 0,
  className,
}: SkillPowerHeroProps) => {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-zinc-900/40 p-8 backdrop-blur-xl", className)}>
      {/* Background Decorative Elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px]" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-[80px]" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-[4px] bg-white/5 flex items-center justify-center text-zinc-300 shadow-lg">
                <TrendingUp size={20} />
             </div>
             <div>
                <h2 className="text-sm font-bold text-zinc-500 leading-none">Your skill power</h2>
                <p className="text-xs text-zinc-600 mt-1">Based on mastered songs difficulty</p>
             </div>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-7xl font-black text-white tracking-tighter">
              {skillPower.toFixed(1)}
            </span>
            <div className="flex flex-col">
               <span className="text-xl font-bold text-white leading-none">Power score</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="grid grid-cols-3 gap-8">
             <div className="space-y-2.5">
                <p className="text-[10px] font-bold tracking-wider text-zinc-500">Mastered</p>
                <div className="flex items-center gap-2">
                   <Music2 size={14} className="text-zinc-500" />
                   <span className="text-lg font-bold text-white">{learnedCount}</span>
                </div>
             </div>
             <div className="space-y-2.5">
                <p className="text-[10px] font-bold tracking-wider text-zinc-500">Total</p>
                <div className="flex items-center gap-2">
                   <Star size={14} className="text-zinc-500" />
                   <span className="text-lg font-bold text-white">{totalCount}</span>
                </div>
             </div>
             <div className="space-y-2.5">
                <p className="text-[10px] font-bold tracking-wider text-zinc-500">Time spent</p>
                <div className="flex items-center gap-2">
                   <Clock size={14} className="text-zinc-500" />
                   <span className="text-lg font-bold text-white whitespace-nowrap">{formatPracticeTime(totalPracticeMs)}</span>
                </div>
             </div>
          </div>

          <div className="h-16 w-px bg-white/5 hidden md:block" />

          <div className="flex flex-col items-center">
             <div
               className="h-24 w-24 rounded-lg flex items-center justify-center text-4xl font-black shadow-2xl mb-3"
               style={{
                 color: playerTier.color,
                 backgroundColor: 'rgba(10,10,10,0.8)',
                 boxShadow: `0 0 40px ${playerTier.color}15`,
               }}
             >
               {playerTier.tier}
             </div>
             <span className="text-[10px] font-bold tracking-wider text-zinc-500">Current tier</span>
          </div>
        </div>
      </div>
    </div>
  );
};
