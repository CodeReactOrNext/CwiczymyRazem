import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Lock } from "lucide-react";
import Image from "next/image";
import {
  FaBrain,
  FaClock,
  FaEdit,
  FaGuitar,
  FaLayerGroup,
  FaListUl,
  FaMusic,
  FaPlay,
  FaTrashAlt,
  FaVideo,
  FaYoutube} from "react-icons/fa";

import type { DifficultyLevel, ExercisePlan } from "../types/exercise.types";

interface PlanCardProps {
  plan: ExercisePlan;
  onSelect?: () => void;
  onStart?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onUpgrade?: () => void;
  startButtonText?: string;
  isLoading?: boolean;
  isLocked?: boolean;
}

const categoryStyles = {
  technique: {
    gradient: "from-blue-500/15 via-zinc-900/60 to-zinc-950",
    border: "border-blue-500/20",
    icon: FaGuitar,
    text: "text-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  theory: {
    gradient: "from-emerald-500/15 via-zinc-900/60 to-zinc-950",
    border: "border-emerald-500/20",
    icon: FaBrain,
    text: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  creativity: {
    gradient: "from-purple-500/15 via-zinc-900/60 to-zinc-950",
    border: "border-purple-500/20",
    icon: FaMusic,
    text: "text-purple-400",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  hearing: {
    gradient: "from-amber-500/15 via-zinc-900/60 to-zinc-950",
    border: "border-amber-500/20",
    icon: FaMusic,
    text: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  mixed: {
    gradient: "from-red-500/15 via-zinc-900/60 to-zinc-950",
    border: "border-red-500/20",
    icon: FaLayerGroup,
    text: "text-red-400",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  playalong: {
    gradient: "from-red-500/15 via-zinc-900/60 to-zinc-950",
    border: "border-red-500/30",
    icon: FaYoutube,
    text: "text-red-400",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export const PlanCard = ({
  plan,
  onSelect,
  onStart,
  onDelete,
  onEdit,
  onUpgrade,
  startButtonText,
  isLoading,
  isLocked = false,
}: PlanCardProps) => {
  const { t } = useTranslation(["exercises", "common"]);

  const getLocalizedString = (value: string | { en?: string; pl?: string } | undefined): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.pl || value.en || '';
  };

  const title = getLocalizedString(plan.title as any);
  const description = getLocalizedString(plan.description as any);

  const totalDuration = plan.exercises.reduce(
    (acc, exercise) => acc + exercise.timeInMinutes,
    0
  );

  const difficulty = ((plan as any).difficulty || "beginner") as
    | DifficultyLevel
    | "beginner";

  const hasPlayalong = plan.exercises.some(ex => ex.isPlayalong || ex.youtubeVideoId);
  const hasVideo = plan.exercises.some(ex => ex.videoUrl && !ex.youtubeVideoId);

  const style = hasPlayalong ? categoryStyles.playalong : (categoryStyles[plan.category as keyof typeof categoryStyles] || categoryStyles.mixed);
  const Icon = style.icon;

  return (
    <Card
      className={cn(
        "relative flex flex-col justify-between overflow-hidden border p-5 rounded-lg transition-colors bg-gradient-to-br",
        style.gradient,
        style.border,
        isLoading && "opacity-80 pointer-events-none",
        isLocked
          ? "border-amber-500/20 cursor-pointer"
          : "click-behavior"
      )}
      onClick={isLocked ? onUpgrade : onSelect}>

      {/* Header: Category Icon & Badges */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-2">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg border bg-zinc-950/50 shadow-sm",
              isLocked ? "border-amber-500/20" : style.border
            )}>
                <Icon className={cn("h-3.5 w-3.5", isLocked ? "text-zinc-400" : style.text)} />
            </div>
            <Badge variant="secondary" className={cn(
              "capitalize tracking-wide px-2 py-0.5 text-[11px] font-medium",
              isLocked ? "bg-zinc-800/80 text-zinc-300 border-zinc-700/50" : style.badge
            )}>
                {t(`exercises:categories.${plan.category}` as any)}
            </Badge>

            {hasPlayalong && !isLocked && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 text-[11px] h-5 px-2 font-medium">
                    <FaYoutube className="mr-1.5 h-2.5 w-2.5" />
                    Playalong
                </Badge>
            )}
            {hasVideo && !isLocked && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30 text-[11px] h-5 px-2 font-medium">
                    <FaVideo className="mr-1.5 h-2.5 w-2.5" />
                    Video
                </Badge>
            )}
        </div>
        <div className="flex items-center gap-2">
            {(onEdit || onDelete) && (
                <div className="flex items-center gap-1 mr-2">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400"
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        >
                            <FaEdit className="h-3 w-3" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-zinc-400"
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        >
                            <FaTrashAlt className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            )}
            {isLocked ? (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 ring-1 ring-amber-500/25">
                <Lock className="h-3 w-3 text-amber-500" />
                <span className="text-[11px] font-medium text-amber-500">Pro</span>
              </div>
            ) : (
              <Badge variant="outline" className="border-white/10 bg-zinc-950/30 text-[11px] h-5 px-2 font-medium capitalize text-muted-foreground whitespace-nowrap">
                  {t(`exercises:difficulty.${difficulty}` as any)}
              </Badge>
            )}
        </div>
      </div>

      {/* Main Content with Avatar */}
      <div className="flex gap-4">
        {plan.author && (
            <div className={cn(
              "relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border shadow-inner",
              isLocked ? "border-white/5 grayscale opacity-50" : "border-white/10"
            )}>
                <Image
                    src={plan.author.avatar}
                    alt={plan.author.name}
                    fill
                    className="object-cover"
                />
            </div>
        )}
        <div className="flex-1 space-y-1">
            {plan.author && (
                <span className={cn(
                  "text-[11px] font-medium leading-none",
                  isLocked ? "text-zinc-400" : "text-primary/80"
                )}>
                    {plan.author.name}
                </span>
            )}
            <h3 className={cn(
              "text-base font-bold leading-tight",
              isLocked ? "text-foreground/90" : "text-foreground"
            )}>
                {title}
            </h3>
            <p className={cn(
              "line-clamp-2 text-[12px] leading-relaxed",
              isLocked ? "text-muted-foreground/80" : "text-muted-foreground/80"
            )}>
                {description}
            </p>
        </div>
      </div>

      {/* Footer: Stats & Action */}
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex items-center gap-4">
            <div className={cn("flex items-center gap-1.5 text-xs font-medium", isLocked ? "text-zinc-600" : "text-muted-foreground")}>
                <FaClock className="h-3.5 w-3.5" />
                <span>{totalDuration} min</span>
            </div>
            <div className={cn("flex items-center gap-1.5 text-xs font-medium", isLocked ? "text-zinc-600" : "text-muted-foreground")}>
                <FaListUl className="h-3.5 w-3.5" />
                <span>{plan.exercises.length}</span>
            </div>
        </div>

        {isLocked ? (
          <Button
            size="sm"
            className="h-8 px-3 text-xs font-semibold shadow-sm gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/25"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onUpgrade?.(); }}
          >
            <Lock className="h-3 w-3" />
            Upgrade
          </Button>
        ) : onStart && (
           <Button
            size="sm"
            className="h-8 px-3 text-xs font-semibold shadow-sm hover:scale-105 transition-all"
            onClick={(e) => {
                e.stopPropagation();
                onStart();
            }}
            disabled={isLoading}
           >
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                </div>
            ) : (
                <>
                    {startButtonText || t("common:start")}
                    <FaPlay className="ml-2 h-2 w-2" />
                </>
            )}
           </Button>
        )}
      </div>
    </Card>
  );
};
