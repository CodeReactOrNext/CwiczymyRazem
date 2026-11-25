import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useLocalizeExercise } from "feature/exercisePlan/hooks/useLocalizedExercises";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { SONG_PRACTICE_MODE_LABELS } from "feature/exercisePlan/utils/songToExercise";
import { useTranslation } from "hooks/useTranslation";
import { Copy, Edit2, GripVertical, ListPlus, Trash2 } from "lucide-react";

interface SelectedExercisesListProps {
  selectedExercises: Exercise[];
  onToggleExercise: (exercise: Exercise) => void;
  onEditExercise?: (exercise: Exercise) => void;
  onCloneExercise?: (exercise: Exercise) => void;
  onEditTimeRequest?: (exercise: Exercise) => void;
  onReorder?: (exercises: Exercise[]) => void;
}

type T = (key: string, options?: Record<string, unknown> | string) => string;

interface SortableItemProps {
  exercise: Exercise;
  index: number;
  onToggleExercise: (exercise: Exercise) => void;
  onEditExercise?: (exercise: Exercise) => void;
  onCloneExercise?: (exercise: Exercise) => void;
  onEditTimeRequest?: (exercise: Exercise) => void;
  t: T;
}

const formatTime = (minutes: number, t: T) =>
  minutes < 1 ? `${Math.round(minutes * 60)}s` : `${minutes} ${t("plans:min")}`;

/** What kind of item it is, when it isn't a plain library exercise. */
const itemKind = (exercise: Exercise, isCustom: boolean, t: T) => {
  if (exercise.songData) {
    const mode = exercise.songData.mode;
    return mode
      ? `${t("plans:song")} · ${t(`plans:song_modes.${mode}`, SONG_PRACTICE_MODE_LABELS[mode])}`
      : t("plans:song");
  }
  if (exercise._generatorConfig) return t("plans:generated");
  if (isCustom) return t("plans:custom");
  return null;
};

/** One item of the plan: its place as a number, its name, its time as a key. */
const SortableItem = ({
  exercise,
  index,
  onToggleExercise,
  onEditExercise,
  onCloneExercise,
  onEditTimeRequest,
  t,
}: SortableItemProps) => {
  const localizeExercise = useLocalizeExercise();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCustom = typeof exercise.id === "string" && exercise.id.startsWith("custom-");
  const title = localizeExercise(exercise).title;
  const kind = itemKind(exercise, isCustom, t);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-[10px] bg-zinc-900/70 py-2.5 pl-3 pr-1.5 transition-colors duration-base",
        isDragging ? "z-50 opacity-60" : "hover:bg-zinc-900",
      )}>
      <span
        aria-hidden
        className='flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs font-bold tabular-nums text-zinc-300'>
        {index + 1}
      </span>

      <div className='min-w-0 flex-1'>
        <h4 className='truncate text-[13px] font-semibold leading-tight text-zinc-200' title={title}>
          {title}
        </h4>
        {kind && <p className='mt-0.5 truncate text-xs text-zinc-500'>{kind}</p>}
      </div>

      <button
        type='button'
        onClick={() => onEditTimeRequest?.(exercise)}
        title={t("plans:change_time")}
        aria-label={`${t("plans:change_time")}: ${formatTime(exercise.timeInMinutes, t)}`}
        className={cn(
          PRESSABLE_KEY,
          "flex h-8 shrink-0 items-center rounded-lg bg-zinc-800 px-2.5 text-xs font-semibold tabular-nums text-zinc-200 transition-colors hover:bg-zinc-700",
        )}>
        {formatTime(exercise.timeInMinutes, t)}
      </button>

      <div className='flex shrink-0 items-center'>
        {(isCustom || !!exercise._generatorConfig) && (
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => onEditExercise?.(exercise)}
            className='text-zinc-500 hover:text-zinc-100'
            title={t("exercises:custom_exercise.edit_button")}
            aria-label={t("exercises:custom_exercise.edit_button")}>
            <Edit2 />
          </Button>
        )}
        {isCustom && (
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => onCloneExercise?.(exercise)}
            className='text-zinc-500 hover:text-zinc-100'
            title={t("exercises:custom_exercise.clone_button")}
            aria-label={t("exercises:custom_exercise.clone_button")}>
            <Copy />
          </Button>
        )}
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={() => onToggleExercise(exercise)}
          className='text-zinc-500 hover:text-red-400'
          title={t("common:button.remove")}
          aria-label={`${t("common:button.remove")}: ${title}`}>
          <Trash2 />
        </Button>
        <button
          className='shrink-0 cursor-grab touch-none px-1 text-zinc-600 transition-colors hover:text-zinc-300 active:cursor-grabbing'
          {...attributes}
          {...listeners}
          tabIndex={-1}
          aria-label={t("plans:drag_to_reorder")}>
          <GripVertical className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
};

/**
 * The plan as it grows, beside the library: how long it runs in one big
 * figure, then its items in order, numbered. Drag to reorder; the time on
 * each is a key that changes it.
 */
export const SelectedExercisesList = ({
  selectedExercises,
  onToggleExercise,
  onEditExercise,
  onCloneExercise,
  onEditTimeRequest,
  onReorder,
}: SelectedExercisesListProps) => {
  const { t } = useTranslation(["exercises", "common", "plans"]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const totalDuration = selectedExercises.reduce((total, exercise) => total + exercise.timeInMinutes, 0);
  const count = selectedExercises.length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedExercises.findIndex((e) => e.id === active.id);
      const newIndex = selectedExercises.findIndex((e) => e.id === over.id);
      onReorder?.(arrayMove(selectedExercises, oldIndex, newIndex));
    }
  };

  return (
    <div className='flex min-h-[200px] min-w-0 flex-col rounded-xl bg-zinc-800/35 p-5'>
      <div className='mb-4 flex shrink-0 items-end justify-between gap-3'>
        <div>
          <p className='text-xs font-medium text-zinc-500'>{t("plans:your_plan")}</p>
          <p className='mt-0.5 text-sm font-semibold text-zinc-200'>
            {count} {count === 1 ? t("plans:select.exercise_one") : t("plans:select.exercises")}
          </p>
        </div>
        <p className='flex items-baseline gap-1'>
          <span className='font-teko text-[40px] font-semibold leading-[0.8] tabular-nums text-zinc-50'>
            {totalDuration < 1 ? Math.round(totalDuration * 60) : Math.round(totalDuration)}
          </span>
          <span className='text-xs text-zinc-500'>{totalDuration < 1 ? "s" : t("plans:min")}</span>
        </p>
      </div>

      <div className='flex-1'>
        {count > 0 ? (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={selectedExercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                <div className='grid gap-2'>
                  {selectedExercises.map((exercise, index) => (
                    <SortableItem
                      key={exercise.id}
                      exercise={exercise}
                      index={index}
                      onToggleExercise={onToggleExercise}
                      onEditExercise={onEditExercise}
                      onCloneExercise={onCloneExercise}
                      onEditTimeRequest={onEditTimeRequest}
                      t={t as T}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <p className='mt-3 text-xs text-zinc-500'>{t("plans:your_plan_hint")}</p>
          </>
        ) : (
          <div className='flex h-full flex-col items-center justify-center rounded-lg bg-zinc-900/40 px-4 py-12 text-center'>
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-500'>
              <ListPlus className='h-6 w-6 opacity-60' />
            </div>
            <p className='max-w-[200px] text-[13px] font-medium leading-relaxed text-zinc-400'>
              {t("plans:none_selected")}
              <span className='mt-1.5 block text-balance text-xs text-zinc-500'>{t("plans:choose_from_library")}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
