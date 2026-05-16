import { cn } from "assets/lib/utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { Music2, Star, TrendingUp } from "lucide-react";

interface SkillPowerHeroProps {
  skillPower: number;
  playerTier: any;
  learnedCount: number;
  totalCount: number;
  className?: string;
}

export const SkillPowerHero = ({
  skillPower,
  playerTier,
  learnedCount,
  totalCount,
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
             <div className="h-10 w-10 rounded-[4px] bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center text-cyan-400 border border-white/5 border-t-cyan-500/40 border-l-cyan-500/20 shadow-lg">
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
               <span className="text-xl font-bold text-cyan-400 leading-none">Power score</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
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
             <span className="text-[10px] font-black text-zinc-500">Current tier</span>
          </div>

          <div className="h-16 w-px bg-white/5 hidden md:block" />

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500">Mastered</p>
                <div className="flex items-center gap-2">
                   <Music2 size={14} className="text-emerald-500" />
                   <span className="text-lg font-bold text-white">{learnedCount}</span>
                </div>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500">Total</p>
                <div className="flex items-center gap-2">
                   <Star size={14} className="text-amber-500" />
                   <span className="text-lg font-bold text-white">{totalCount}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
