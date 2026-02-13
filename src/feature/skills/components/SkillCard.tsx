import { cn } from "assets/lib/utils";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkill } from "feature/skills/skills.types";
import { useTranslation } from "hooks/useTranslation";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/router";

interface SkillCardProps {
  skill: GuitarSkill;
  currentPoints: number;
}

const COLOR_CLASSES: Record<string, { iconBg: string; iconText: string; blur: string; ring: string }> = {
  technique: {
    iconBg: "bg-red-500/20",
    iconText: "text-red-400",
    blur: "bg-red-500/25",
    ring: "hover:ring-red-500/40",
  },
  theory: {
    iconBg: "bg-blue-500/20",
    iconText: "text-blue-400",
    blur: "bg-blue-500/25",
    ring: "hover:ring-blue-500/40",
  },
  hearing: {
    iconBg: "bg-emerald-500/20",
    iconText: "text-emerald-400",
    blur: "bg-emerald-500/25",
    ring: "hover:ring-emerald-500/40",
  },
  creativity: {
    iconBg: "bg-purple-500/20",
    iconText: "text-purple-400",
    blur: "bg-purple-500/25",
    ring: "hover:ring-purple-500/40",
  },
};

interface SkillCardProps {
  skill: GuitarSkill;
  currentPoints: number;
  onSkillClick: () => void;
}

export const SkillCard = ({
  skill,
  currentPoints,
  onSkillClick,
}: SkillCardProps) => {
  const { t } = useTranslation("skills");
  const theme = getSkillTheme(skill.category);
  const colors = COLOR_CLASSES[skill.category] || COLOR_CLASSES.technique;
  const Icon = skill.icon;
  const router = useRouter();

  return (
    <div
      onClick={onSkillClick}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl cursor-pointer",
        "border border-second-400/10 bg-gradient-to-br from-card via-second-500/95 to-second-600",
        "p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:ring-2 active:scale-95",
        colors.ring
      )}
    >
      <div className={cn(colors.blur, "absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full blur-2xl")} />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
           <div className={cn(
             "rounded-xl p-3 shadow-2xl transition-all duration-500 group-hover:scale-110",
             colors.iconBg,
             colors.iconText
           )}>
             {Icon && <Icon className="w-6 h-6" strokeWidth={1.5} />}
           </div>

           <div className="flex flex-col flex-1 min-w-0">
             <h3 className="text-base font-bold tracking-tight text-white truncate mb-1">
               {skill.name || t(`skills.${skill.id}.name` as any)}
             </h3>
             <div className="flex items-baseline gap-1.5">
                <span className={cn("text-2xl font-black tabular-nums leading-none tracking-tight", colors.iconText)}>
                    {currentPoints}
                </span>
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">XP</span>
             </div>
           </div>
        </div>

        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
          "bg-white/5 group-hover:bg-white/10 text-zinc-500 group-hover:text-white"
        )}>
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};
