import type { DragEndEvent, Modifier } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { ExercisePreviewDialog } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/ExercisePreviewDialog";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { useTranslation } from "hooks/useTranslation";
import { Play,RefreshCw } from "lucide-react";
import { useState } from "react";
import { formatMinutesDuration } from "utils/converter";

import { ExerciseCard } from "./ExerciseCard";

/**
 * The list only reorders up and down. Left free, a card dragged sideways hung
 * off the phone screen, the page grew wider than the viewport and auto-scroll
 * dragged the whole screen along with the card.
 */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/** No sideways auto-scroll; up/down only near the very edge of the screen. */
const AUTO_SCROLL = { threshold: { x: 0, y: 0.12 } };

interface GeneratedPlanProps {
  plan: ExercisePlan;
  /** The length the player asked for; the heading shows the real sum against it. */
  targetMinutes: number;
  onBack: () => void;
  onRegenerate: () => void;
  onStart: (plan: ExercisePlan) => void;
  onMoveExercise: (from: number, to: number) => void;
  onReplaceExercise: (index: number) => void;
  onRemoveExercise: (index: number) => void;
  isStarting?: boolean;
}

export const GeneratedPlan = ({
  plan,
  targetMinutes,
  onBack,
  onRegenerate,
  onStart,
  onMoveExercise,
  onReplaceExercise,
  onRemoveExercise,
  isStarting
}: GeneratedPlanProps) => {
  const { t } = useTranslation(["exercises", "common", "practice_hub"]);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so a tap on the handle
    // doesn't count as one.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const exerciseIds = plan.exercises.map((exercise) => exercise.id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onMoveExercise(
      exerciseIds.indexOf(String(active.id)),
      exerciseIds.indexOf(String(over.id)),
    );
  };

  // The picker fills up to the requested length but rarely hits it exactly,
  // and removing or swapping exercises moves it further — so the heading
  // reports what is actually in the plan instead of echoing the request.
  const totalMinutes = plan.exercises.reduce(
    (sum, exercise) => sum + exercise.timeInMinutes,
    0,
  );
  const exerciseCount = plan.exercises.length;

  return (
    <div className='mx-auto mt-3 max-w-3xl space-y-6 px-4 font-openSans'>
      <div className='mb-6 flex flex-col gap-4 sm:mb-10 sm:gap-6'>
        <h1 className='pt-2 text-2xl font-bold sm:pt-4 sm:text-3xl'>
          {t("exercises:auto_plan.generated_plan")}
        </h1>

        <div className='flex flex-wrap gap-2'>
          <Button
            variant='secondary'
            onClick={onBack}
            disabled={isStarting}
>
            {t("common:back")}
          </Button>
          <Button
            variant='secondary'
            onClick={onRegenerate}
            disabled={isStarting}
>
            <RefreshCw className='h-4 w-4' />
            {t("practice_hub:auto.regenerate")}
          </Button>
          <Button
            onClick={() => onStart(plan)}
            className='ml-auto'
            disabled={isStarting}
          >
            <span className="flex items-center gap-2">
              {isStarting ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t("practice_hub:loading")}</span>
                  </>
              ) : (
                  <>
                    <Play size='1em' className='h-3.5 w-3.5' />
                    <span>{t("common:start")}</span>
                  </>
              )}
            </span>
          </Button>
        </div>
      </div>

      <Card className='rounded-2xl bg-transparent p-0 sm:bg-zinc-800/40 sm:p-7'>
        <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
          <h2 className='text-2xl font-extrabold tabular-nums sm:text-[26px]'>
            {formatMinutesDuration(totalMinutes)}{" "}
            <span className='text-base font-semibold text-zinc-400'>
              {t("practice_hub:auto.of_target", { minutes: targetMinutes })}
            </span>
          </h2>
          <span className='text-sm text-zinc-400'>
            {exerciseCount === 1
              ? t("practice_hub:auto.exercise_one")
              : t("practice_hub:auto.exercise_many", { count: exerciseCount })}
          </span>
        </div>

        {/* How much of the requested time the plan fills right now. */}
        <div
          aria-hidden
          className='mb-5 mt-3 h-3 overflow-hidden rounded-full bg-zinc-800 sm:mb-6'>
          <div
            className='h-full rounded-full bg-primary transition-[width] duration-base'
            style={{
              width: `${
                targetMinutes > 0
                  ? Math.min(100, (totalMinutes / targetMinutes) * 100)
                  : 0
              }%`,
            }}
          />
        </div>

        <DndContext
          id='generated-plan-exercises'
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[verticalOnly]}
          autoScroll={AUTO_SCROLL}
          onDragEnd={handleDragEnd}>
          <SortableContext
            items={exerciseIds}
            strategy={verticalListSortingStrategy}>
            <div className='space-y-2.5'>
              {plan.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  exerciseCount={exerciseCount}
                  onMove={onMoveExercise}
                  onReplace={onReplaceExercise}
                  onRemove={onRemoveExercise}
                  onPreview={setPreviewExercise}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className='mt-6 pt-4 sm:mt-8'>
          <Button
            onClick={() => onStart(plan)}
            className='w-full'
            size='lg'
            variant='default'
            disabled={isStarting}
          >
            <span className="flex items-center gap-2">
              {isStarting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t("practice_hub:loading")}</span>
                  </>
              ) : (
                  <>
                    <Play size='1em' className='h-4 w-4' />
                    <span>{t("common:start")}</span>
                  </>
              )}
            </span>
          </Button>
        </div>
      </Card>

      <ExercisePreviewDialog
        exercise={previewExercise}
        onClose={() => setPreviewExercise(null)}
      />
    </div>
  );
};
