import { Badge } from "assets/components/ui/badge";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { ExerciseDetailsDialog } from "feature/exercisePlan/components/ExerciseDetailsDialog";
import type {
  Exercise,
} from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "hooks/useTranslation";
import { Lock } from "lucide-react";
import { useState } from "react";
import {
  FaArrowRight,
  FaBrain,
  FaClock,
  FaGuitar,
  FaLayerGroup,
  FaMusic,
  FaVideo,
  FaYoutube} from "react-icons/fa";

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect?: () => void;
  disableDialog?: boolean;
  isLocked?: boolean;
  onUpgrade?: () => void;
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

export const ExerciseCard = ({ exercise, disableDialog, isLocked = false, onUpgrade }: ExerciseCardProps) => {
  const { t } = useTranslation(["exercises", "common"]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleCardClick = () => {
    if (isLocked) { onUpgrade?.(); return; }
    if (disableDialog) return;
    setIsDetailsOpen(true);
  };

  const exerciseSkills = exercise.relatedSkills
    .map((skillId) => guitarSkills.find((skill) => skill.id === skillId))
    .filter(Boolean);

  const style = categoryStyles[exercise.category] || categoryStyles.mixed;
  const Icon = style.icon;

  return (
    <>
      <Card
        className={cn(
          "group relative flex flex-col justify-between overflow-hidden border bg-gradient-to-br transition-all duration-300 p-6 glass-card rounded-lg",
          style.border,
          style.gradient,
          isLocked
            ? "border-amber-500/20 cursor-pointer hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]"
            : "hover:shadow-xl click-behavior"
        )}
        onClick={handleCardClick}>

        {/* Locked hover overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 ring-1 ring-amber-500/40">
                <Lock className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Unlock with Pro</span>
            </div>
          </div>
        )}

        {/* Header: Category Icon & Badges */}
        <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md border bg-zinc-950/50 shadow-sm",
                  isLocked ? "border-amber-500/20" : style.border
                )}>
                    <Icon className={cn("h-4 w-4", isLocked ? "text-zinc-500" : style.text)} />
                </div>
                <Badge variant="secondary" className={cn(
                  "capitalize tracking-wide font-bold",
                  isLocked ? "bg-zinc-800/60 text-zinc-500 border-zinc-700/50" : style.badge
                )}>
                    {t(`exercises:categories.${exercise.category}` as any).toLowerCase()}
                </Badge>
                {exercise.isPlayalong && !isLocked && (
                  <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-500/30 flex items-center gap-1.5 px-2 py-0.5 text-[10px] h-5 font-bold">
                    <FaYoutube className="h-3 w-3" />
                    Playalong
                  </Badge>
                )}
                {exercise.videoUrl && !exercise.isPlayalong && !isLocked && (
                  <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 flex items-center gap-1.5 px-2 py-0.5 text-[10px] h-5 font-bold">
                    <FaVideo className="h-3 w-3" />
                    Video
                  </Badge>
                )}
            </div>
            {isLocked ? (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 ring-1 ring-amber-500/25">
                <Lock className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pro</span>
              </div>
            ) : (
              <Badge variant="outline" className="border-white/10 bg-zinc-950/30 text-xs font-bold capitalize text-muted-foreground">
                   {t(`exercises:difficulty.${exercise.difficulty}` as any)}
              </Badge>
            )}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-3">
            <h3 className={cn(
              "text-xl font-bold leading-tight transition-colors",
              isLocked ? "text-zinc-400" : "text-foreground group-hover:text-primary"
            )}>
                {exercise.title}
            </h3>
            <p className={cn(
              "line-clamp-2 text-sm leading-relaxed",
              isLocked ? "text-zinc-600" : "text-muted-foreground/80"
            )}>
                {exercise.description}
            </p>
        </div>

        {/* Footer: Stats & Skills */}
        <div className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-4">
             <div className="flex items-center justify-between">
                 <div className={cn("flex items-center gap-1.5 text-xs font-medium", isLocked ? "text-zinc-600" : "text-muted-foreground")}>
                    <FaClock className="h-3.5 w-3.5" />
                    <span>{exercise.timeInMinutes} min</span>
                 </div>

                {isLocked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs font-bold uppercase tracking-wider gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40"
                    onClick={(e) => { e.stopPropagation(); onUpgrade?.(); }}
                  >
                    <Lock className="h-3 w-3" />
                    Upgrade
                  </Button>
                ) : (
                  <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground p-0 font-bold"
                  >
                      {t("common:details")} <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
             </div>

             {/* Skills Tags */}
            {!isLocked && (
              <div className="flex flex-wrap gap-2">
                  {exerciseSkills.slice(0, 3).map((skill) => (
                      skill && (
                          <div key={skill.id} className="flex items-center gap-1.5 rounded-lg bg-zinc-900/60 px-2 py-1 text-[10px] font-bold text-muted-foreground border border-white/5">
                              {skill.icon && <skill.icon className="h-2.5 w-2.5" />}
                              {t(`common:skills.${skill.id}` as any)}
                          </div>
                      )
                  ))}
                  {exerciseSkills.length > 3 && (
                       <span className="text-[10px] text-muted-foreground py-1">+{exerciseSkills.length - 3}</span>
                  )}
              </div>
            )}
        </div>
      </Card>

      {!isLocked && (
        <ExerciseDetailsDialog
          exercise={exercise}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}
    </>
  );
};
