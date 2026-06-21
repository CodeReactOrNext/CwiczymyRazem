import { Badge } from "assets/components/ui/badge";
import { cn } from "assets/lib/utils";
import { TablaturePreview } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/TablaturePreview";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "hooks/useTranslation";
import { ArrowDown, ArrowUp, Clock, Info, Shuffle, Trash2, Video } from "lucide-react";
import { FaYoutube } from "react-icons/fa6";

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  generatedPlan: ExercisePlan | null;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onReplace: (index: number) => void;
  onRemove: (index: number) => void;
  onPreview?: (exercise: Exercise) => void;
}

export const ExerciseCard = ({
  exercise,
  index,
  generatedPlan,
  onMoveUp,
  onMoveDown,
  onReplace,
  onRemove,
  onPreview,
}: ExerciseCardProps) => {
  const { t } = useTranslation(["exercises", "common"]);

  const skills = exercise.relatedSkills
    .map((skillId) => guitarSkills.find((s) => s.id === skillId))
    .filter(Boolean);

  const isFirst = index === 0;
  const isLast = !generatedPlan || index >= generatedPlan.exercises.length - 1;

  const formattedTime =
    exercise.timeInMinutes < 1
      ? `${Math.round(exercise.timeInMinutes * 60)}s`
      : `${exercise.timeInMinutes} min`;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-lg border border-transparent transition-all duration-500 overflow-hidden",
        "bg-zinc-900/20 ring-1 ring-inset ring-white/5 hover:ring-white/15 hover:bg-zinc-800/40"
      )}
    >
      {/* Top Colorful Line effect */}
      <div className={cn(
        "absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r opacity-40 group-hover:opacity-100 transition-opacity duration-500",
        exercise.category === "technique" ? "from-emerald-500/0 via-emerald-500 to-emerald-500/0" :
          exercise.category === "theory" ? "from-blue-500/0 via-blue-500 to-blue-500/0" :
          exercise.category === "creativity" ? "from-purple-500/0 via-purple-500 to-purple-500/0" :
          "from-amber-500/0 via-amber-500 to-amber-500/0"
      )} />

      {/* Subtle radial glow in background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(255,255,255,0.06),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Main content wrapper */}
      <div className="relative flex flex-col sm:flex-row items-stretch min-h-[90px]">
        {/* Texts & Badges */}
        <div className="flex-1 min-w-0 p-4 pb-5 sm:p-5 flex flex-col justify-center">
          <div>
            <h3 className="font-semibold text-[15px] sm:text-[16px] leading-tight tracking-tight text-zinc-100 group-hover:text-white transition-colors duration-300">
              {exercise.title}
            </h3>
            <p className="mt-1.5 text-[13px] sm:text-[14px] line-clamp-1 sm:line-clamp-2 leading-relaxed text-zinc-500 group-hover:text-zinc-300 transition-colors duration-300 pr-2">
              {exercise.description}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-4">
            <Badge variant="outline" className="px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded border-white/5 bg-white/5 backdrop-blur-md shadow-none text-zinc-300 transition-colors duration-300">
              <Clock className="mr-1 h-3 w-3" />
              {formattedTime}
            </Badge>

            <Badge variant="outline" className={cn(
              "px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded border-white/5 bg-white/5 backdrop-blur-md shadow-none transition-colors duration-300",
              exercise.category === "technique"  && "text-emerald-400 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10",
              exercise.category === "theory"     && "text-blue-400 group-hover:border-blue-500/30 group-hover:bg-blue-500/10",
              exercise.category === "creativity" && "text-purple-400 group-hover:border-purple-500/30 group-hover:bg-purple-500/10",
              exercise.category === "hearing"    && "text-amber-400 group-hover:border-amber-500/30 group-hover:bg-amber-500/10",
            )}>
              {t(`common:categories.${exercise.category}` as any)}
            </Badge>

            <Badge variant="outline" className={cn(
              "px-2.5 py-0.5 text-[11px] font-medium tracking-wide rounded border-white/5 bg-white/5 backdrop-blur-md shadow-none transition-colors duration-300",
              exercise.difficulty === "beginner" && "text-sky-400 group-hover:border-sky-500/30 group-hover:bg-sky-500/10",
              exercise.difficulty === "easy"   && "text-green-400 group-hover:border-green-500/30 group-hover:bg-green-500/10",
              exercise.difficulty === "medium" && "text-yellow-400 group-hover:border-yellow-500/30 group-hover:bg-yellow-500/10",
              exercise.difficulty === "hard"   && "text-red-400 group-hover:border-red-500/30 group-hover:bg-red-500/10",
            )}>
              {t(`common:difficulty.${exercise.difficulty}` as any)}
            </Badge>

            {exercise.isPlayalong && (
              <Badge className="bg-red-500/10 text-red-500 border-transparent text-[11px] px-2.5 py-0.5 font-medium tracking-wide rounded shadow-none">
                <FaYoutube className="mr-1 h-3.5 w-3.5" />Playalong
              </Badge>
            )}
            {exercise.videoUrl && !exercise.isPlayalong && (
              <Badge className="bg-cyan-500/10 text-cyan-500 border-transparent text-[11px] px-2.5 py-0.5 font-medium tracking-wide rounded shadow-none">
                <Video className="mr-1 h-3.5 w-3.5" />Video
              </Badge>
            )}

            {skills.map((skill) => {
              if (!skill) return null;
              const Icon = skill.icon;
              return (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1 mt-0.5 sm:mt-0 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors bg-white/[0.03] border border-white/5 rounded"
                >
                  {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
                  {t(`common:skills.${skill.id}` as any)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Desktop Right Side: Tablature stacked above Action Buttons */}
        <div className="hidden sm:flex flex-col shrink-0 items-end justify-center gap-3 py-4 pr-5">
          {/* Tablature Preview Desktop */}
          {exercise.tablature && exercise.tablature.length > 0 && (
            <div className="relative w-[220px] shrink-0 opacity-40 group-hover:opacity-90 transition-opacity duration-500 flex items-center justify-end">
               <TablaturePreview measures={exercise.tablature} />
            </div>
          )}

          {/* Action buttons on Desktop */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onPreview && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onPreview(exercise); }}
                className="flex items-center justify-center min-w-[36px] h-[36px] rounded-lg transition-colors duration-300 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 ring-1 ring-white/10"
                title={t("exercises:common.preview") as string}
              >
                <Info className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onReplace(index); }}
              className="flex items-center justify-center min-w-[36px] h-[36px] rounded-lg transition-colors duration-300 bg-white/5 text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 ring-1 ring-white/10"
              title={t("common:button.random") as string}
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
              disabled={isFirst}
              className="flex items-center justify-center min-w-[36px] h-[36px] rounded-lg transition-colors duration-300 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 ring-1 ring-white/10 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
              disabled={isLast}
              className="flex items-center justify-center min-w-[36px] h-[36px] rounded-lg transition-colors duration-300 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 ring-1 ring-white/10 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
              className="flex items-center justify-center min-w-[36px] h-[36px] rounded-lg transition-colors duration-300 bg-white/5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 ring-1 ring-white/10"
              title={t("common:button.remove") as string}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Action Bar */}
        <div className="sm:hidden w-full border-t border-white/5 py-3 px-4 flex justify-between items-center bg-white/[0.02]">
          {onPreview ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPreview(exercise); }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400"
            >
              <Info className="h-4 w-4" />
              {t("exercises:common.preview")}
            </button>
          ) : (
            <span className="text-[12px] font-medium text-zinc-500">#{index + 1}</span>
          )}
          <div className="flex flex-row items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onReplace(index); }}
              className="flex items-center justify-center min-w-[36px] h-[36px] rounded-lg bg-white/5 text-zinc-300 ring-1 ring-white/10"
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
              disabled={isFirst}
              className="flex items-center justify-center min-w-[36px] h-[36px] rounded-lg bg-white/5 text-zinc-300 ring-1 ring-white/10 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
              disabled={isLast}
              className="flex items-center justify-center min-w-[36px] h-[36px] rounded-lg bg-white/5 text-zinc-300 ring-1 ring-white/10 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
              className="flex items-center justify-center min-w-[36px] h-[36px] rounded-lg bg-white/5 text-red-400 ring-1 ring-white/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
