import { Button, PRESSABLE_KEY } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { DifficultyBars } from "feature/exercisePlan/components/DifficultyBars";
import { useLocalizeExercise } from "feature/exercisePlan/hooks/useLocalizedExercises";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { Check, Heart, Info, Lock, Plus, Video } from "lucide-react";
import { FaYoutube } from "react-icons/fa6";

import { TablaturePreview } from "./TablaturePreview";

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  /** Minutes the plan gives it, once added — said under the title. */
  addedMinutes?: number;
  onToggle: (exercise: Exercise) => void;
  isLocked?: boolean;
  onUpgrade?: () => void;
  onPreview?: (exercise: Exercise) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /** The user owns this exercise but hasn't published it — it's still usable in a plan. */
  isPrivate?: boolean;
}

/** The category as a dot of its own colour before its name. */
const CATEGORY_DOT: Record<string, string> = {
  technique: "bg-emerald-400",
  theory: "bg-blue-400",
  hearing: "bg-amber-400",
  creativity: "bg-purple-400",
};

const formatMinutes = (minutes: number) =>
  minutes < 1 ? `${Math.round(minutes * 60)}s` : `${minutes} min`;

/**
 * One exercise in the plan builder's library. Ticked with the big square on
 * the left (the whole row toggles too); an added one turns green and says how
 * long the plan gives it. One quiet line of facts under the title — category
 * and difficulty — where a row of chips used to bury the name; the skills it
 * trains are in the preview behind (i).
 */
export const ExerciseCard = ({
  exercise,
  isSelected,
  addedMinutes,
  onToggle,
  isLocked = false,
  onUpgrade,
  onPreview,
  isFavorite = false,
  onToggleFavorite,
  isPrivate = false,
}: ExerciseCardProps) => {
  const { t } = useTranslation(["common", "exercises", "plans"]);
  const localizeExercise = useLocalizeExercise();
  const { title, description } = localizeExercise(exercise);

  const handleClick = () => {
    if (isLocked) {
      onUpgrade?.();
      return;
    }
    onToggle(exercise);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3.5 transition-colors duration-base sm:gap-5 sm:px-[18px] sm:py-4",
        isLocked
          ? "bg-zinc-900/40"
          : isSelected
            ? "bg-emerald-500/10 hover:bg-emerald-500/15"
            : "bg-zinc-800/35 hover:bg-zinc-800/60",
      )}>
      {isLocked ? (
        <span
          aria-hidden
          className='flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-amber-500/10 text-amber-400'>
          <Lock className='h-4 w-4' />
        </span>
      ) : (
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onToggle(exercise);
          }}
          aria-pressed={isSelected}
          aria-label={isSelected ? t("plans:card.exercise_added") : t("plans:card.pick_exercise")}
          className={cn(
            PRESSABLE_KEY,
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] transition-colors",
            isSelected
              ? "bg-emerald-500 text-white hover:bg-emerald-400"
              : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-200",
          )}>
          {isSelected ? <Check className='h-5 w-5' strokeWidth={3} /> : <Plus className='h-[18px] w-[18px]' />}
        </button>
      )}

      <div className='min-w-0 flex-1'>
        <h3
          className={cn(
            "truncate text-[15px] font-bold leading-tight sm:text-base",
            isLocked ? "text-zinc-500" : isSelected ? "text-emerald-300" : "text-zinc-100",
          )}>
          {title}
        </h3>
        <div className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400'>
          {isSelected && addedMinutes !== undefined && (
            <span className='font-semibold text-emerald-400'>
              {t("plans:card.added_minutes", { time: formatMinutes(addedMinutes) })}
            </span>
          )}
          <span className='flex items-center gap-1.5'>
            <span aria-hidden className={cn("h-[7px] w-[7px] rounded-full", CATEGORY_DOT[exercise.category] ?? "bg-zinc-500")} />
            {t(`common:categories.${exercise.category}` as any)}
          </span>
          <span className='flex items-center gap-1.5'>
            <DifficultyBars difficulty={exercise.difficulty} size='sm' />
            {t(`common:difficulty.${exercise.difficulty}` as any)}
          </span>
          {isPrivate && (
            <span className='flex items-center gap-1'>
              <Lock className='h-3 w-3' aria-hidden />
              {t("plans:private")}
            </span>
          )}
          {exercise.isPlayalong ? (
            <span className='flex items-center gap-1'>
              <FaYoutube className='h-3.5 w-3.5 text-red-500' aria-hidden />
              {t("plans:playalong")}
            </span>
          ) : (
            exercise.videoUrl && (
              <span className='flex items-center gap-1'>
                <Video className='h-3.5 w-3.5' aria-hidden />
                {t("plans:video")}
              </span>
            )
          )}
        </div>
        {description && (
          <p className={cn("mt-1.5 line-clamp-1 text-[13px]", isLocked ? "text-zinc-600" : "text-zinc-500")}>
            {description}
          </p>
        )}
      </div>

      {exercise.tablature && exercise.tablature.length > 0 && (
        <div className='hidden w-[180px] shrink-0 opacity-30 transition-opacity duration-slow group-hover:opacity-70 lg:block'>
          <TablaturePreview measures={exercise.tablature} />
        </div>
      )}

      {isLocked ? (
        <Chip color='amber'>
          <Lock className='h-3.5 w-3.5' />
          {t("plans:pro")}
        </Chip>
      ) : (
        <div className='flex shrink-0 items-center gap-1.5'>
          {onToggleFavorite && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              aria-label={isFavorite ? t("plans:remove_favorite") : t("plans:add_favorite")}
              aria-pressed={isFavorite}
              // Favourited = the heart lights up; the face stays the same key.
              className={cn(
                "shrink-0",
                isFavorite ? "text-rose-400 hover:text-rose-300" : "text-zinc-400 hover:text-rose-300",
              )}
              title={isFavorite ? t("plans:remove_favorite") : t("plans:add_favorite")}>
              <Heart className={cn(isFavorite && "fill-current")} />
            </Button>
          )}
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={(e) => {
              e.stopPropagation();
              onPreview?.(exercise);
            }}
            className='shrink-0 text-zinc-400'
            title={t("plans:preview_details")}
            aria-label={t("plans:preview_details")}>
            <Info />
          </Button>
        </div>
      )}
    </div>
  );
};
