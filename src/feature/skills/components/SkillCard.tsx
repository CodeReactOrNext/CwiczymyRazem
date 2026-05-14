import { cn } from "assets/lib/utils";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkill } from "feature/skills/skills.types";
import { useTranslation } from "hooks/useTranslation";
import { ChevronRight } from "lucide-react";

interface SkillCardProps {
  skill: GuitarSkill;
  currentPoints: number;
  onSkillClick: () => void;
}

const COLOR_CLASSES: Record<string, { iconBg: string; iconBorder: string; iconText: string; }> = {
  technique: {
    iconBg: "bg-gradient-to-br from-rose-500/20 to-rose-500/5",
    iconBorder: "border border-white/5 border-t-rose-500/40 border-l-rose-500/20",
    iconText: "text-rose-400",
  },
  theory: {
    iconBg: "bg-gradient-to-br from-indigo-500/20 to-indigo-500/5",
    iconBorder: "border border-white/5 border-t-indigo-500/40 border-l-indigo-500/20",
    iconText: "text-indigo-400",
  },
  hearing: {
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5",
    iconBorder: "border border-white/5 border-t-emerald-500/40 border-l-emerald-500/20",
    iconText: "text-emerald-400",
  },
  creativity: {
    iconBg: "bg-gradient-to-br from-amber-500/20 to-amber-500/5",
    iconBorder: "border border-white/5 border-t-amber-500/40 border-l-amber-500/20",
    iconText: "text-amber-400",
  },
};

export const SkillCard = ({
  skill,
  currentPoints,
  onSkillClick,
}: SkillCardProps) => {
  const { t } = useTranslation("skills");
  const colors = COLOR_CLASSES[skill.category] || COLOR_CLASSES.technique;
  const Icon = skill.icon;

  return (
    <div
      onClick={onSkillClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg bg-white/[0.02] p-3.5 backdrop-blur-sm transition-all duration-300",
        "border border-white/[0.02] cursor-pointer hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-black/20"
      )}
    >
      <div className={cn(
        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-105 shadow-lg",
        colors.iconBg,
        colors.iconBorder,
        colors.iconText
      )}>
        {Icon && <Icon className="w-6 h-6" strokeWidth={2} />}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="truncate text-[14px] font-bold text-zinc-100 group-hover:text-white transition-colors mb-0.5">
          {skill.name || t(`skills.${skill.id}.name` as any)}
        </h3>
        <p className={cn("truncate text-[12px] font-semibold transition-colors", colors.iconText)}>
          {currentPoints} <span className="opacity-70 font-medium">XP</span>
        </p>
      </div>

      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/0 transition-all duration-300">
        <ChevronRight className="h-4 w-4 text-zinc-700 transition-all group-hover:translate-x-1 group-hover:text-zinc-200" />
      </div>
    </div>
  );
};
