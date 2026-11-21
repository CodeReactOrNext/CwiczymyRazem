import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PRESSABLE_KEY } from "assets/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { TablaturePreview } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/TablaturePreview";
import { useLocalizeExercise } from "feature/exercisePlan/hooks/useLocalizedExercises";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { useTranslation } from "hooks/useTranslation";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Info,
  MoreHorizontal,
  Shuffle,
  Trash2,
  Video,
} from "lucide-react";
import { FaYoutube } from "react-icons/fa6";
import { formatMinutesDuration } from "utils/converter";

import { CATEGORY_DOT, DIFFICULTY_DOT, FALLBACK_DOT } from "./categoryStyles";

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  exerciseCount: number;
  onMove: (from: number, to: number) => void;
  onReplace: (index: number) => void;
  onRemove: (index: number) => void;
  onPreview?: (exercise: Exercise) => void;
}

/** A small grey key on the card: the touch arrows and the "…" menu. */
const CARD_KEY = cn(
  PRESSABLE_KEY,
  "flex shrink-0 items-center justify-center rounded-lg bg-zinc-700/70 text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
);

/**
 * One row of a generated plan.
 *
 * Reordering depends on the pointer. With a mouse it's a drag on the grip
 * (keyboard: focus the grip, Space, arrows). Dragging doesn't work on touch,
 * so a touch screen gets an up and a down key around the row's number instead
 * and no grip at all. Details, swap and remove — plus move up/down again, for
 * anyone who'd rather not drag — live in the "…" menu.
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
  const localizeExercise = useLocalizeExercise();
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
  const { title, description } = localizeExercise(exercise);

  const formattedTime =
    exercise.timeInMinutes < 1
      ? `${Math.round(exercise.timeInMinutes * 60)}s`
      : formatMinutesDuration(exercise.timeInMinutes);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group relative flex items-stretch rounded-xl bg-zinc-800/50 transition-colors duration-base hover:bg-zinc-800/80 sm:min-h-[90px]",
        isDragging && "z-20 bg-zinc-800 opacity-90",
      )}>
      {/* Touch: up / number / down, since a drag doesn't work there. */}
      <div className='flex shrink-0 flex-col items-center justify-center gap-1 py-3 pl-3 pr-1 [@media(pointer:fine)]:hidden'>
        <button
          type='button'
          disabled={isFirst}
          onClick={() => onMove(index, index - 1)}
          aria-label={`${t("practice_hub:auto.move_up")}: ${title}`}
          className={cn(CARD_KEY, "h-9 w-9")}>
          <ArrowUp className='h-4 w-4' />
        </button>
        <span className='text-sm font-bold tabular-nums text-zinc-100'>
          {index + 1}
        </span>
        <button
          type='button'
          disabled={isLast}
          onClick={() => onMove(index, index + 1)}
          aria-label={`${t("practice_hub:auto.move_down")}: ${title}`}
          className={cn(CARD_KEY, "h-9 w-9")}>
          <ArrowDown className='h-4 w-4' />
        </button>
      </div>

      {/* Mouse: the whole left strip is the drag handle. */}
      <button
        ref={setActivatorNodeRef}
        type='button'
        {...attributes}
        {...listeners}
        aria-label={t("practice_hub:auto.reorder", { title })}
        title={t("practice_hub:auto.drag_to_reorder")}
        className='hidden shrink-0 cursor-grab touch-none items-center pl-3 pr-1 text-zinc-600 transition-colors hover:text-zinc-300 focus-visible:text-zinc-200 focus-visible:outline-none active:cursor-grabbing [@media(pointer:fine)]:flex'>
        <GripVertical className='h-4 w-4' />
      </button>
      <span className='ml-1 mr-2 hidden h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg bg-zinc-700/70 text-sm font-bold tabular-nums text-zinc-100 [@media(pointer:fine)]:flex'>
        {index + 1}
      </span>

      {/* Title, description and one quiet line of facts */}
      <div className='flex min-w-0 flex-1 flex-col justify-center py-4 pl-2 pr-2 sm:py-5'>
        <h3 className='text-[15px] font-bold leading-tight tracking-tight text-zinc-100 sm:text-[16px]'>
          {title}
        </h3>
        <p className='mt-1.5 hidden pr-2 text-[14px] leading-relaxed text-zinc-400 sm:line-clamp-2 sm:block'>
          {description}
        </p>

        <div className='mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-zinc-400 sm:mt-3'>
          <span className='font-bold text-zinc-100'>{formattedTime}</span>

          <span className='inline-flex items-center gap-1.5 text-zinc-300'>
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                CATEGORY_DOT[exercise.category] ?? FALLBACK_DOT,
              )}
            />
            {t(`common:categories.${exercise.category}` as any)}
          </span>

          <span className='inline-flex items-center gap-1.5 text-zinc-300'>
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                DIFFICULTY_DOT[exercise.difficulty] ?? FALLBACK_DOT,
              )}
            />
            {t(`common:difficulty.${exercise.difficulty}` as any)}
          </span>

          {exercise.isPlayalong && (
            <span className='inline-flex items-center gap-1.5'>
              <FaYoutube className='h-3.5 w-3.5 shrink-0' />
              {t("practice_hub:auto.playalong")}
            </span>
          )}
          {exercise.videoUrl && !exercise.isPlayalong && (
            <span className='inline-flex items-center gap-1.5'>
              <Video className='h-3.5 w-3.5 shrink-0' />
              {t("practice_hub:auto.video")}
            </span>
          )}

          {skills.map((skill) => {
            if (!skill) return null;
            const Icon = skill.icon;
            return (
              <span
                key={skill.id}
                className='hidden items-center gap-1.5 sm:inline-flex'>
                {Icon && <Icon className='h-3.5 w-3.5 shrink-0 opacity-80' />}
                {t(`common:skills.${skill.id}` as any)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Right side: the row menu, with the tablature under it on desktop */}
      <div className='flex shrink-0 flex-col items-end gap-3 py-3 pr-3 sm:py-4 sm:pr-5'>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              aria-label={t("practice_hub:auto.options_for", { title })}
              title={t("practice_hub:auto.options")}
              className={cn(
                CARD_KEY,
                "h-10 w-10 data-[state=open]:bg-zinc-700 data-[state=open]:text-white",
              )}>
              <MoreHorizontal className='h-4 w-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            sideOffset={6}
            collisionPadding={16}
            className='w-48 border-white/10 bg-zinc-900 p-1.5 text-zinc-100 shadow-none'>
            {onPreview && (
              <DropdownMenuItem
                onSelect={() => onPreview(exercise)}
                className='cursor-pointer focus:bg-white/10 focus:text-zinc-100'>
                <Info />
                {t("exercises:common.preview")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={() => onReplace(index)}
              className='cursor-pointer focus:bg-white/10 focus:text-zinc-100'>
              <Shuffle />
              {t("practice_hub:auto.swap")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isFirst}
              onSelect={() => onMove(index, index - 1)}
              className='cursor-pointer focus:bg-white/10 focus:text-zinc-100'>
              <ArrowUp />
              {t("practice_hub:auto.move_up")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isLast}
              onSelect={() => onMove(index, index + 1)}
              className='cursor-pointer focus:bg-white/10 focus:text-zinc-100'>
              <ArrowDown />
              {t("practice_hub:auto.move_down")}
            </DropdownMenuItem>
            {/* Gap instead of a separator line, so the destructive action
                sits apart from the rest. */}
            <DropdownMenuItem
              onSelect={() => onRemove(index)}
              className='mt-1.5 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300'>
              <Trash2 />
              {t("common:button.remove")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {exercise.tablature && exercise.tablature.length > 0 && (
          <div className='relative hidden w-[220px] shrink-0 items-center justify-end opacity-60 transition-opacity duration-slow group-hover:opacity-90 sm:flex'>
            <TablaturePreview measures={exercise.tablature} />
          </div>
        )}
      </div>
    </div>
  );
};
