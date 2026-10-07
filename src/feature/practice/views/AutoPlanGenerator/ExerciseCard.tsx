import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "assets/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { TablaturePreview } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/TablaturePreview";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "hooks/useTranslation";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  GripVertical,
  Info,
  MoreHorizontal,
  Shuffle,
  Trash2,
  Video,
} from "lucide-react";
import { FaYoutube } from "react-icons/fa6";
import { formatMinutesDuration } from "utils/converter";

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  exerciseCount: number;
  onMove: (from: number, to: number) => void;
  onReplace: (index: number) => void;
  onRemove: (index: number) => void;
  onPreview?: (exercise: Exercise) => void;
}

/**
 * One row of a generated plan. Reordering is a drag on the grip (keyboard:
 * focus the grip, Space, arrows); everything else — details, swap, remove,
 * and a move up/down fallback for anyone who'd rather not drag — lives in
 * the "…" menu, so the row doesn't carry five same-weight icon buttons with
 * a destructive one right next to the arrows.
 */
export const ExerciseCard = ({
  exercise,
  index,
  exerciseCount,
  onMove,
  onReplace,
  onRemove,
  onPreview,
}: ExerciseCardProps) => {
  const { t } = useTranslation(["exercises", "common", "practice_hub"]);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const skills = exercise.relatedSkills
    .map((skillId) => guitarSkills.find((s) => s.id === skillId))
    .filter(Boolean);

  const isFirst = index === 0;
  const isLast = index >= exerciseCount - 1;

  const formattedTime =
    exercise.timeInMinutes < 1
      ? `${Math.round(exercise.timeInMinutes * 60)}s`
      : formatMinutesDuration(exercise.timeInMinutes);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group relative flex flex-col rounded-lg border border-transparent transition-all duration-500 overflow-hidden",
        "bg-zinc-900/20 ring-1 ring-inset ring-white/5 hover:ring-white/15 hover:bg-zinc-800/40",
        isDragging && "z-20 bg-zinc-800/60 opacity-90"
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

      <div className="relative flex items-stretch sm:min-h-[90px]">
        {/* Drag handle — the whole left strip, so it's an easy target on touch */}
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t("practice_hub:auto.reorder", { title: exercise.title })}
          title={t("practice_hub:auto.drag_to_reorder")}
          className="flex shrink-0 cursor-grab touch-none items-center pl-2 pr-1 text-zinc-600 transition-colors hover:text-zinc-300 focus-visible:text-zinc-200 focus-visible:outline-none active:cursor-grabbing sm:pl-3"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Texts & Badges */}
        <div className="flex-1 min-w-0 py-4 pr-2 pl-1 sm:py-5 flex flex-col justify-center">
          <div>
            <h3 className="font-semibold text-[15px] sm:text-[16px] leading-tight tracking-tight text-zinc-100 group-hover:text-white transition-colors duration-300">
              {exercise.title}
            </h3>
            <p className="mt-1.5 hidden text-[13px] sm:block sm:text-[14px] sm:line-clamp-2 leading-relaxed text-zinc-500 group-hover:text-zinc-300 transition-colors duration-300 pr-2">
              {exercise.description}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-4">
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
                <FaYoutube className="mr-1 h-3.5 w-3.5" />{t("practice_hub:auto.playalong")}
              </Badge>
            )}
            {exercise.videoUrl && !exercise.isPlayalong && (
              <Badge className="bg-cyan-500/10 text-cyan-500 border-transparent text-[11px] px-2.5 py-0.5 font-medium tracking-wide rounded shadow-none">
                <Video className="mr-1 h-3.5 w-3.5" />{t("practice_hub:auto.video")}
              </Badge>
            )}

            {skills.map((skill) => {
              if (!skill) return null;
              const Icon = skill.icon;
              return (
                <span
                  key={skill.id}
                  className="hidden sm:inline-flex items-center gap-1 mt-0.5 sm:mt-0 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors bg-white/[0.03] border border-white/5 rounded"
                >
                  {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
                  {t(`common:skills.${skill.id}` as any)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right side: tablature (desktop) with the row menu above it */}
        <div className="flex shrink-0 flex-col items-end gap-3 py-3 pr-3 sm:py-4 sm:pr-5">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("practice_hub:auto.options_for", { title: exercise.title })}
                title={t("practice_hub:auto.options")}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=open]:bg-white/10 data-[state=open]:text-zinc-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              collisionPadding={16}
              className="w-48 border-white/10 bg-zinc-900 p-1.5 text-zinc-100 shadow-none"
            >
              {onPreview && (
                <DropdownMenuItem
                  onSelect={() => onPreview(exercise)}
                  className="cursor-pointer focus:bg-white/10 focus:text-zinc-100"
                >
                  <Info />
                  {t("exercises:common.preview")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => onReplace(index)}
                className="cursor-pointer focus:bg-white/10 focus:text-zinc-100"
              >
                <Shuffle />
                {t("practice_hub:auto.swap")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isFirst}
                onSelect={() => onMove(index, index - 1)}
                className="cursor-pointer focus:bg-white/10 focus:text-zinc-100"
              >
                <ArrowUp />
                {t("practice_hub:auto.move_up")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isLast}
                onSelect={() => onMove(index, index + 1)}
                className="cursor-pointer focus:bg-white/10 focus:text-zinc-100"
              >
                <ArrowDown />
                {t("practice_hub:auto.move_down")}
              </DropdownMenuItem>
              {/* Gap instead of a separator line, so the destructive action
                  sits apart from the rest. */}
              <DropdownMenuItem
                onSelect={() => onRemove(index)}
                className="mt-1.5 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300"
              >
                <Trash2 />
                {t("common:button.remove")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {exercise.tablature && exercise.tablature.length > 0 && (
            <div className="relative hidden w-[220px] shrink-0 items-center justify-end opacity-40 transition-opacity duration-500 group-hover:opacity-90 sm:flex">
              <TablaturePreview measures={exercise.tablature} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
