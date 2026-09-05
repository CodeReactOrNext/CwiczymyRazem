import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { CheckCircle2, ChevronRight, Circle, Dumbbell } from "lucide-react";
import React from "react";

import type { RoadmapStep } from "../../../types/roadmap.types";
import type { YouTubeLessonResult } from "../../../types/youtubeLesson.types";
import { getResourceProgress } from "../../../utils/stepStatus";
import YouTubeLessonCard from "./YouTubeLessonCard";

interface ResourceToggleProps {
  checked: boolean;
  label: string;
  onClick: () => void;
}

/** The tick beside a resource. One tap marks it used; another undoes it. */
const ResourceToggle = ({ checked, label, onClick }: ResourceToggleProps) => (
  <button
    type='button'
    onClick={onClick}
    aria-pressed={checked}
    aria-label={label}
    title={label}
    className={cn(
      "flex w-12 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      checked
        ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
        : "bg-zinc-900/40 text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200",
    )}>
    {checked ? (
      <CheckCircle2 className='h-5 w-5' />
    ) : (
      <Circle className='h-5 w-5' />
    )}
  </button>
);

const SkeletonRow = () => (
  <div className='flex h-[76px] animate-pulse items-center gap-4 rounded-lg bg-zinc-900/40 px-4'>
    <div className='h-10 w-10 shrink-0 rounded-lg bg-zinc-800' />
    <div className='flex-1 space-y-2'>
      <div className='h-3 w-3/4 rounded bg-zinc-800' />
      <div className='h-2.5 w-1/2 rounded bg-zinc-800' />
    </div>
  </div>
);

interface StepResourcesProps {
  step: RoadmapStep;
  lessons: YouTubeLessonResult[];
  loadingLessons: boolean;
  loadingExercise: boolean;
  onOpenExercise: (exerciseId: string) => void;
  onToggleExercise: () => void;
  onToggleLesson: (videoId: string) => void;
  onPracticeLesson: (lesson: YouTubeLessonResult) => void;
}

/**
 * The step's practice kit: the recommended exercise and the lessons, each as a
 * row you open plus a tick you set. Ticking everything is what completes the step.
 */
export const StepResources: React.FC<StepResourcesProps> = ({
  step,
  lessons,
  loadingLessons,
  loadingExercise,
  onOpenExercise,
  onToggleExercise,
  onToggleLesson,
  onPracticeLesson,
}) => {
  const exercise =
    step.suggestedExerciseId && !step.noExercise
      ? exercisesAgregat.find((e) => e.id === step.suggestedExerciseId)
      : undefined;
  const exerciseDone = !!step.exerciseCompleted;
  const { completed, total } = getResourceProgress(step, lessons);
  const allDone = total > 0 && completed >= total;

  return (
    <section className='flex flex-col gap-4'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h3 className='text-sm font-semibold text-zinc-100'>Practice kit</h3>
          <p className='mt-1 text-xs leading-relaxed text-zinc-400'>
            Open a resource to work with it, then tick it off. Ticking
            everything completes the step.
          </p>
        </div>
        {total > 0 && (
          <Chip
            color={allDone ? "emerald" : "gray"}
            className='shrink-0 tabular-nums'>
            {completed}/{total}
          </Chip>
        )}
      </div>

      <div className='flex flex-col gap-3'>
        {loadingExercise && <SkeletonRow />}

        {exercise && !loadingExercise && (
          <div className='flex items-stretch gap-2'>
            <button
              type='button'
              onClick={() => onOpenExercise(exercise.id)}
              className={cn(
                "group flex min-w-0 flex-1 items-center gap-4 rounded-lg px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                exerciseDone
                  ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                  : "bg-zinc-900/40 hover:bg-zinc-800/60",
              )}>
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  exerciseDone
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-cyan-500/10 text-cyan-400",
                )}>
                <Dumbbell className='h-5 w-5' />
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block truncate text-sm font-semibold text-zinc-100'>
                  {exercise.title}
                </span>
                {exercise.difficulty && (
                  <span className='mt-0.5 block truncate text-xs capitalize text-zinc-400'>
                    {exercise.difficulty} · {exercise.category}
                  </span>
                )}
              </span>
              <ChevronRight className='h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-200' />
            </button>
            <ResourceToggle
              checked={exerciseDone}
              label={
                exerciseDone ? "Practiced. Tap to undo" : "Mark as practiced"
              }
              onClick={onToggleExercise}
            />
          </div>
        )}

        {loadingLessons && (
          <>
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {!loadingLessons &&
          lessons.map((lesson) => {
            const watched =
              step.completedLessonIds?.includes(lesson.videoId) ?? false;
            return (
              <div key={lesson.videoId} className='flex items-stretch gap-2'>
                <YouTubeLessonCard
                  lesson={lesson}
                  onClick={() => onPracticeLesson(lesson)}
                  className={cn(
                    "min-w-0 flex-1",
                    watched && "bg-emerald-500/10 hover:bg-emerald-500/15",
                  )}
                />
                <ResourceToggle
                  checked={watched}
                  label={watched ? "Watched. Tap to undo" : "Mark as watched"}
                  onClick={() => onToggleLesson(lesson.videoId)}
                />
              </div>
            );
          })}
      </div>
    </section>
  );
};
