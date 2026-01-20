import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkill } from "feature/skills/skills.types";
import { useTranslation } from "react-i18next";

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
    <div className="bg-[#141414] rounded-lg p-5 flex flex-col gap-4 transition-colors group relative overflow-hidden shadow-lg">
      <div className="flex items-start gap-3 sm:gap-4 z-10">
        <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-zinc-900/50 flex-shrink-0",
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

       <div className={cn(
         "absolute -top-20 -right-20 w-40 h-40 blur-[80px] rounded-full pointer-events-none opacity-10 transition-opacity group-hover:opacity-20",
         theme.glow
       )} />
    </div>
  );
};
