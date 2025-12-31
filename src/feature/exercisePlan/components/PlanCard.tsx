import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { useTranslation } from "react-i18next";
import { 
  FaClock, 
  FaListUl, 
  FaPlay, 
  FaGuitar, 
  FaBrain, 
  FaMusic, 
  FaLayerGroup,
  FaTrashAlt,
  FaEdit
} from "react-icons/fa";

import type { DifficultyLevel, ExercisePlan } from "../types/exercise.types";

interface PlanCardProps {
  plan: ExercisePlan;
  onSelect?: () => void;
  onStart?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  startButtonText?: string;
}

const categoryStyles = {
  technique: {
    gradient: "from-blue-500/10 via-zinc-950/50 to-zinc-950",
    border: "border-blue-500/20",
    icon: FaGuitar,
    text: "text-blue-500",
    badge: "bg-blue-500/10 text-blue-200 border-blue-500/20",
  },
  theory: {
    gradient: "from-emerald-500/10 via-zinc-950/50 to-zinc-950",
    border: "border-emerald-500/20",
    icon: FaBrain,
    text: "text-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
  },
  creativity: {
    gradient: "from-purple-500/10 via-zinc-950/50 to-zinc-950",
    border: "border-purple-500/20",
    icon: FaMusic,
    text: "text-purple-500",
    badge: "bg-purple-500/10 text-purple-200 border-purple-500/20",
  },
  hearing: {
    gradient: "from-amber-500/10 via-zinc-950/50 to-zinc-950",
    border: "border-amber-500/20",
    icon: FaMusic,
    text: "text-amber-500",
    badge: "bg-amber-500/10 text-amber-200 border-amber-500/20",
  },
  mixed: {
    gradient: "from-red-500/10 via-zinc-950/50 to-zinc-950",
    border: "border-red-500/20",
    icon: FaLayerGroup,
    text: "text-red-500",
    badge: "bg-red-500/10 text-red-200 border-red-500/20",
  },
};

export const PlanCard = ({
  plan,
  onSelect,
  onStart,
  onDelete,
  onEdit,
  startButtonText,
}: PlanCardProps) => {
  const { t, i18n } = useTranslation(["exercises", "common"]);

  const title =
    typeof plan.title === "string"
      ? plan.title
      : plan.title?.[i18n.language as keyof typeof plan.title] ||
        plan.title?.pl;
  const description =
    typeof plan.description === "string"
      ? plan.description
      : plan.description?.[i18n.language as keyof typeof plan.description] ||
        plan.description?.pl;

  const totalDuration = plan.exercises.reduce(
    (acc, exercise) => acc + exercise.timeInMinutes,
    0
  );

  const difficulty = ((plan as any).difficulty || "beginner") as
    | DifficultyLevel
    | "beginner";

  const style = categoryStyles[plan.category] || categoryStyles.mixed;
  const Icon = style.icon;

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden border bg-gradient-to-br transition-all duration-300 hover:shadow-xl p-4 glass-card radius-premium click-behavior",
        style.border,
        style.gradient
      )}
      onClick={onSelect}>
      
      {/* Header: Category Icon & Badges */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg border bg-zinc-950/50 shadow-sm ${style.border}`}>
                <Icon className={`h-3.5 w-3.5 ${style.text}`} />
            </div>
            <Badge variant="secondary" className={`capitalize tracking-wide px-2 py-0.5 text-[10px] ${style.badge}`}>
                {t(`exercises:categories.${plan.category}` as any)}
            </Badge>
        </div>
        <div className="flex items-center gap-2">
            {(onEdit || onDelete) && (
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 mr-2">
                    {onEdit && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/10"
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        >
                            <FaEdit className="h-3 w-3" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            <FaTrashAlt className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            )}
            <Badge variant="outline" className="border-white/10 bg-zinc-950/30 text-[10px] h-5 px-2 font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                {t(`exercises:difficulty.${difficulty}` as any)}
            </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-1.5">
        <h3 className="text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
            {title}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
            {description}
        </p>
      </div>

      {/* Footer: Stats & Action */}
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <FaClock className="h-3.5 w-3.5" />
                <span>{totalDuration} min</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <FaListUl className="h-3.5 w-3.5" />
                <span>{plan.exercises.length}</span>
            </div>
        </div>

        {onStart && (
           <Button 
            size="sm" 
            className="h-8 px-3 text-xs font-semibold shadow-sm transition-all hover:scale-105"
            onClick={(e) => {
                e.stopPropagation();
                onStart();
            }}
           >
            {startButtonText || t("common:start")} 
            <FaPlay className="ml-2 h-2 w-2" />
           </Button>
        )}
      </div>
    </Card>
  );
};
