import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { Clock, Edit2, Copy, Trash2, GripVertical, ListPlus } from "lucide-react";
import { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SelectedExercisesListProps {
  selectedExercises: Exercise[];
  onToggleExercise: (exercise: Exercise) => void;
  onEditExercise?: (exercise: Exercise) => void;
  onCloneExercise?: (exercise: Exercise) => void;
  onEditTimeRequest?: (exercise: Exercise) => void;
  onReorder?: (exercises: Exercise[]) => void;
}

interface SortableItemProps {
  exercise: Exercise;
  onToggleExercise: (exercise: Exercise) => void;
  onEditExercise?: (exercise: Exercise) => void;
  onCloneExercise?: (exercise: Exercise) => void;
  onEditTimeRequest?: (exercise: Exercise) => void;
  t: (key: string) => string;
}

const SortableItem = ({
  exercise,
  onToggleExercise,
  onEditExercise,
  onCloneExercise,
  onEditTimeRequest,
  t,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCustom = typeof exercise.id === "string" && exercise.id.startsWith("custom-");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-3 rounded-[8px] border transition-all duration-300 shadow-none min-w-0 pr-1.5",
        isDragging 
            ? "opacity-50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-cyan-500/30 bg-cyan-900/20 backdrop-blur-md" 
            : "border-white/5 bg-white/[0.02] p-2.5 sm:p-3 hover:border-white/10 hover:bg-white/[0.04]"
      )}
    >
      {/* Drag handle */}
      <button
        className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 cursor-grab active:cursor-grabbing touch-none pl-1"
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0 pl-1">
        <h4 className="font-semibold text-zinc-200 text-[13px] sm:text-[14px] leading-tight break-words group-hover:text-white transition-colors" title={exercise.title}>
          {exercise.title}
        </h4>
        <div className="flex items-center gap-3 mt-1.5">
          <button
            type="button"
            onClick={() => onEditTimeRequest?.(exercise)}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-cyan-300 transition-all group/time bg-black/20 hover:bg-black/40 border border-white/5 hover:border-cyan-500/30 px-2 py-1 rounded-[6px]"
            title="Click to change time"
          >
            <Clock className="h-3 w-3 text-cyan-500/70 group-hover/time:text-cyan-400 transition-colors" />
            <span className="text-[12px] font-bold">{exercise.timeInMinutes}</span>
            <span className="text-[10px] font-medium text-zinc-500 group-hover/time:text-cyan-500/70 transition-colors">min</span>
            <Edit2 className="h-3 w-3 text-zinc-600 group-hover/time:text-cyan-400 transition-colors ml-0.5" />
          </button>
          
          {isCustom && (
            <span className="px-1.5 py-0.5 rounded-[4px] bg-cyan-500/10 text-cyan-400/90 border border-cyan-500/20 text-[9px] font-bold tracking-wide">
              Custom
            </span>
          )}
          {!!exercise._generatorConfig && (
            <span className="px-1.5 py-0.5 rounded-[4px] bg-indigo-500/10 text-indigo-400/90 border border-indigo-500/20 text-[9px] font-bold tracking-wide">
              Generated
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center shrink-0">
        {(isCustom || !!exercise._generatorConfig) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEditExercise?.(exercise)}
            className="h-8 w-8 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-[8px] transition-all"
            title={t("exercises:custom_exercise.edit_button")}
          >
            <Edit2 size={14} />
          </Button>
        )}
        {isCustom && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCloneExercise?.(exercise)}
            className="h-8 w-8 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-[8px] transition-all"
            title={t("exercises:custom_exercise.clone_button")}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleExercise(exercise)}
          className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-[8px] transition-all"
          title={t("common:button.remove")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const SelectedExercisesList = ({
  selectedExercises,
  onToggleExercise,
  onEditExercise,
  onCloneExercise,
  onEditTimeRequest,
  onReorder,
}: SelectedExercisesListProps) => {
  const { t } = useTranslation(["exercises", "common"]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const totalDuration = selectedExercises.reduce(
    (total, exercise) => total + exercise.timeInMinutes,
    0
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedExercises.findIndex((e) => e.id === active.id);
      const newIndex = selectedExercises.findIndex((e) => e.id === over.id);
      onReorder?.(arrayMove(selectedExercises, oldIndex, newIndex));
    }
  };

  return (
    <div className="rounded-[8px] border border-white/5 bg-zinc-900/10 p-5 min-h-[200px] flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div className="space-y-0.5">
          <h3 className="text-[14px] font-bold text-zinc-100 flex items-center gap-2">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-[8px] bg-cyan-500",
                selectedExercises.length > 0 && "animate-pulse"
              )}
            />
            {t("exercises:my_plans.create_dialog.selected_exercises" as any, {
              count: selectedExercises.length,
            })}
          </h3>
          <p className="text-[11px] text-zinc-500 font-medium tracking-wide">
            {selectedExercises.length > 0 ? "Review and manage your plan items" : "Your plan is empty"}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-[8px] bg-white/[0.03] backdrop-blur-md px-3.5 py-1.5 border border-white/5 shadow-sm transition-colors">
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[13px] font-bold text-zinc-200">
            {totalDuration} <span className="text-zinc-500 font-medium">min</span>
          </span>
        </div>
      </div>

      <div className="flex-1">
        {selectedExercises.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedExercises.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-2">
                {selectedExercises.map((exercise) => (
                  <SortableItem
                    key={exercise.id}
                    exercise={exercise}
                    onToggleExercise={onToggleExercise}
                    onEditExercise={onEditExercise}
                    onCloneExercise={onCloneExercise}
                    onEditTimeRequest={onEditTimeRequest}
                    t={t as (key: string) => string}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-white/5 rounded-[8px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.02),transparent)] transition-all">
            <div className="w-12 h-12 rounded-[8px] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4 text-zinc-600 backdrop-blur-sm">
              <ListPlus className="h-6 w-6 opacity-50" />
            </div>
            <p className="text-zinc-400 font-medium text-[13px] leading-relaxed max-w-[180px]">
              No exercises selected yet.
              <span className="block text-zinc-600 text-[11px] mt-1.5 tracking-wider text-balance">
                Choose from the library →
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
