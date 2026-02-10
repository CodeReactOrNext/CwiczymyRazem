import { cn } from "assets/lib/utils";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkill } from "feature/skills/skills.types";
import { useTranslation } from "hooks/useTranslation";

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

export const SkillCard = ({
  skill,
  currentPoints,
}: SkillCardProps) => {
  const { t } = useTranslation("skills");
  const theme = getSkillTheme(skill.category);
  const colors = COLOR_CLASSES[skill.category] || COLOR_CLASSES.technique;
  const Icon = skill.icon;
  const visualMax = 50;
  const progress = Math.min((currentPoints / visualMax) * 100, 100);

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl",
        "border border-second-400/10 bg-gradient-to-br from-card via-second-500/95 to-second-600",
        "p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:ring-2",
        colors.ring
      )}
    >
      <div className={cn(colors.blur, "absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full blur-2xl")} />

      <div className="relative z-10 flex items-center gap-4">
        <div className={cn(
          "rounded-xl p-2.5 shadow-2xl transition-all duration-500 group-hover:scale-110",
          colors.iconBg,
          colors.iconText
        )}>
          {Icon && <Icon className="w-5 h-5" strokeWidth={1.5} />}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold tracking-tight text-white truncate">
            {skill.name || t(`skills.${skill.id}.name` as any)}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={cn("w-1 h-1 rounded-full", colors.iconBg)} />
            <span className="text-zinc-300 text-xs font-medium">Level {Math.floor(currentPoints / 10) + 1}</span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-white text-xl font-bold tabular-nums leading-none">{currentPoints}</span>
          <span className="text-zinc-500 text-[10px] font-semibold mt-0.5">{visualMax} XP</span>
        </div>
      </div>

      <div className="relative z-10 mt-4">
        <div className="h-1 w-full bg-second-400/20 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-1000 ease-out", theme.glow)}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
