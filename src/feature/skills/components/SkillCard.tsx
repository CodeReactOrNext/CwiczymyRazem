import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { ExerciseCheckmark } from "feature/skills/components/ExerciseCheckmark";
import { getSkillAccentClass, SkillIconTile } from "feature/skills/components/SkillIconTile";
import type { GuitarSkill } from "feature/skills/skills.types";
import { useTranslation } from "hooks/useTranslation";
import { Check, ChevronRight, X } from "lucide-react";

interface SkillCardProps {
  skill: GuitarSkill;
  currentPoints: number;
  exerciseProgress?: {
    completed: number;
    total: number;
    states: { done: boolean; title: string }[];
  };
  onSkillClick: () => void;
}

export const SkillCard = ({
  skill,
  currentPoints,
  exerciseProgress,
  onSkillClick,
}: SkillCardProps) => {
  const { t } = useTranslation("skills");
  const accent = getSkillAccentClass(skill.category);

  const hasExercises = !!exerciseProgress && exerciseProgress.total > 0;

  return (
    <div
      onClick={onSkillClick}
      className={cn(
        "group relative flex items-start gap-3 rounded-lg bg-white/[0.02] p-3.5 backdrop-blur-sm transition-all duration-300",
        "border border-white/[0.02] cursor-pointer hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-black/20"
      )}
    >
      <SkillIconTile
        category={skill.category}
        icon={skill.icon}
        className="group-hover:scale-105"
      />

      <div className="flex-1 min-w-0">
        <h3 className="truncate text-[14px] font-bold text-zinc-100 group-hover:text-white transition-colors mb-0.5">
          {skill.name || t(`skills.${skill.id}.name` as any)}
        </h3>
        <p className={cn("truncate text-[12px] font-semibold transition-colors", accent)}>
          {currentPoints} <span className="opacity-70 font-medium">XP</span>
        </p>

        {hasExercises && (
          <TooltipProvider delayDuration={120}>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {exerciseProgress!.states.map((state, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <ExerciseCheckmark done={state.done} />
                  </TooltipTrigger>
                  <TooltipContent className="flex items-center gap-1.5">
                    {state.done ? (
                      <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                    ) : (
                      <X className="h-3 w-3 text-zinc-500" strokeWidth={3} />
                    )}
                    {state.title}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}
      </div>

      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/0 transition-all duration-300">
        <ChevronRight className="h-4 w-4 text-zinc-700 transition-all group-hover:translate-x-1 group-hover:text-zinc-200" />
      </div>
    </div>
  );
};
