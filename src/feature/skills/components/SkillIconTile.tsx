import { cn } from "assets/lib/utils";
import type { IconType } from "react-icons";

/**
 * The tinted tile a skill icon sits on. Lives here rather than inside SkillCard
 * so the Skill Tree and the exercise browser show a skill the same way — the
 * gradient and the accent are the only thing that tells a wall of otherwise
 * identical cards apart at a glance.
 */
const TILE_COLORS: Record<string, { bg: string; edge: string; text: string }> = {
  technique: {
    bg: "bg-gradient-to-br from-rose-500/20 to-rose-500/5",
    edge: "border border-white/5 border-l-rose-500/20 border-t-rose-500/40",
    text: "text-rose-400",
  },
  theory: {
    bg: "bg-gradient-to-br from-indigo-500/20 to-indigo-500/5",
    edge: "border border-white/5 border-l-indigo-500/20 border-t-indigo-500/40",
    text: "text-indigo-400",
  },
  hearing: {
    bg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5",
    edge: "border border-white/5 border-l-emerald-500/20 border-t-emerald-500/40",
    text: "text-emerald-400",
  },
  creativity: {
    bg: "bg-gradient-to-br from-amber-500/20 to-amber-500/5",
    edge: "border border-white/5 border-l-amber-500/20 border-t-amber-500/40",
    text: "text-amber-400",
  },
};

/** Accent text colour for a category, for labels sitting next to a tile. */
export const getSkillAccentClass = (category: string): string =>
  (TILE_COLORS[category] ?? TILE_COLORS.technique).text;

interface SkillIconTileProps {
  category: string;
  icon?: IconType;
  /** `md` is the Skill Tree card; `sm` fits a list row. */
  size?: "sm" | "md";
  className?: string;
}

export const SkillIconTile = ({
  category,
  icon: Icon,
  size = "md",
  className,
}: SkillIconTileProps) => {
  const colors = TILE_COLORS[category] ?? TILE_COLORS.technique;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-lg shadow-lg transition-all duration-300",
        size === "md" ? "h-12 w-12" : "h-11 w-11",
        colors.bg,
        colors.edge,
        colors.text,
        className
      )}
    >
      {Icon && <Icon className={size === "md" ? "h-6 w-6" : "h-[22px] w-[22px]"} strokeWidth={2} />}
    </div>
  );
};
