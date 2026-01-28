import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkill } from "feature/skills/skills.types";
import { useTranslation } from "hooks/useTranslation";
import { ArrowUpRight } from "lucide-react";

interface SkillCardProps {
  skill: GuitarSkill;
  currentPoints: number;
}

export const SkillCard = ({
  skill,
  currentPoints,
}: SkillCardProps) => {
  const { t } = useTranslation("skills");
  const theme = getSkillTheme(skill.category);
  const Icon = skill.icon;

  const visualMax = 50; 
  const progress = Math.min((currentPoints / visualMax) * 100, 100);

  return (
    <div className="group relative bg-[#0f0f0f] border border-zinc-900 rounded-lg p-5 transition-all duration-300 overflow-hidden">
      {/* Hover Background Decor */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 bg-gradient-to-br",
        theme.glow
      )} />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-white font-bold text-base tracking-tight leading-tight transition-colors">
                {skill.name || t(`skills.${skill.id}.name` as any)}
              </h3>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-zinc-500 text-[12px] line-clamp-2 cursor-help font-medium leading-normal">
                    {t(`skills.${skill.id}.description` as any)}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[260px] bg-black border border-zinc-800 text-zinc-300 p-3 shadow-2xl rounded-lg">
                  <p className="text-xs leading-relaxed">{t(`skills.${skill.id}.description` as any)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center bg-zinc-950 border border-zinc-800/80 transition-all duration-500 relative overflow-hidden",
            theme.primary
          )}>
            {/* Subtle Pattern in Icon Box */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
               <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#grid)" />
               </svg>
            </div>
            {Icon && <Icon className="w-5 h-5 relative z-10" strokeWidth={1.5} />}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Progress</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-white leading-none">{currentPoints}</span>
                <span className="text-zinc-600 text-[10px] font-bold">/ {visualMax} XP</span>
              </div>
            </div>
            <div className="px-2 py-0.5 rounded-sm bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
              Tier {Math.floor(currentPoints / 10) + 1}
            </div>
          </div>
          
          <div className="h-1 w-full bg-zinc-900/50 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-1000 ease-out", theme.glow)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
