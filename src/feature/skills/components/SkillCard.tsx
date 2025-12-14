import { cn } from "assets/lib/utils";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkill, GuitarSkillId } from "feature/skills/skills.types";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";

interface SkillCardProps {
  skill: GuitarSkill;
  currentPoints: number;
  availableCategoryPoints: number;
  onUpgrade: (skillId: GuitarSkillId, points: number) => void;
}

export const SkillCard = ({
  skill,
  currentPoints,
  availableCategoryPoints,
  onUpgrade,
}: SkillCardProps) => {
  const { t } = useTranslation("skills");
  const theme = getSkillTheme(skill.category);
  const Icon = skill.icon;

  // Level logic (assuming max 100 for visual bar, or maybe 50?)
  // Let's assume infinite or high cap for now, visual bar fills to next "Milestone" vs simple linear?
  // For dashboard, simple linear 0-100 or relative to some max is fine.
  // Let's settle on a visual max of 100 for the bar segment, but allow infinite points.
  // Or maybe relative to current points + 10?
  // Let's just visually cap at 100 for now or cycle. 
  // User screenshot shows "Technika 4% 108h 42m". This implies time tracking.
  // But here we are spending points. Let's just show raw points.
  const visualMax = 50; 
  const progress = Math.min((currentPoints / visualMax) * 100, 100);

  const handleUpgrade = (amount: number) => {
    if (availableCategoryPoints >= amount) {
      onUpgrade(skill.id, amount);
    }
  };

  return (
    <div className="bg-[#141414] border border-zinc-800/50 rounded-xl p-5 flex flex-col gap-4 hover:border-zinc-700 transition-colors group relative overflow-hidden">
      {/* Top Row: Icon + Name + Current Lvl */}
      <div className="flex items-start gap-3 sm:gap-4 z-10">
        <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center border bg-zinc-900/50 flex-shrink-0",
            theme.border,
            theme.primary
        )}>
           {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base text-white font-bold leading-tight truncate">{skill.name || t(`skills.${skill.id}.name` as any)}</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-zinc-500 text-xs mt-1 line-clamp-2 cursor-help">
                    {t(`skills.${skill.id}.description` as any)}
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{t(`skills.${skill.id}.description` as any)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
        <div className="flex flex-col items-end flex-shrink-0">
             <span className="text-xl sm:text-2xl font-bold text-white">{currentPoints}</span>
             <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Level</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-1.5 z-10">
         <div className="flex justify-between text-xs text-zinc-400">
            <span>Progress</span>
            <span>{currentPoints} / {visualMax} (Milestone)</span>
         </div>
         <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
             <div 
               className={cn("h-full transition-all duration-500", theme.glow)}
               style={{ width: `${progress}%` }}
             />
         </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 mt-2 z-10">
         {[1, 5, 10].map((amount) => {
            const canAfford = availableCategoryPoints >= amount;
            return (
                    <button
                        onClick={() => handleUpgrade(amount)}
                        disabled={!canAfford}
                        className={cn(
                            "py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1",
                            canAfford 
                                ? `bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 active:scale-95`
                                : "bg-zinc-950/50 border-zinc-900 text-zinc-700 cursor-not-allowed opacity-50"
                        )}
                    >
                        <Plus className="w-3 h-3" />
                        {amount}
                    </button>
            );
         })}
      </div>

       {/* Ambient Glow from Theme */}
       <div className={cn(
         "absolute -top-20 -right-20 w-40 h-40 blur-[80px] rounded-full pointer-events-none opacity-10 transition-opacity group-hover:opacity-20",
         theme.glow
       )} />
    </div>
  );
};
