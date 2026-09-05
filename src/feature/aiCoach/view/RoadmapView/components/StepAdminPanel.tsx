import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import {
  ChevronRight,
  Dumbbell,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import React from "react";
import { FaYoutube } from "react-icons/fa6";

import type { RoadmapPhase, RoadmapStep } from "../../../types/roadmap.types";
import type { YouTubeLessonResult } from "../../../types/youtubeLesson.types";
import type { RoadmapStepRef } from "../../../utils/roadmapSteps";
import YouTubeLessonCard from "./YouTubeLessonCard";

const TEXTAREA_CLS =
  "w-full resize-y rounded-lg bg-zinc-800/60 px-3 py-2 text-sm leading-relaxed text-zinc-200 outline-none transition-colors focus:ring-1 focus:ring-cyan-500";
const INPUT_CLS =
  "flex-1 rounded-lg bg-zinc-800/60 px-2.5 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-500 focus:ring-1 focus:ring-red-600";
const LINK_BTN_CLS =
  "text-[11px] text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const SMALL_BTN_CLS =
  "flex items-center gap-2 rounded bg-zinc-800 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export interface StepAdminPanelProps {
  current: RoadmapStepRef;
  lessons: YouTubeLessonResult[];
  /** Candidate exercise ids returned by the last search, if a search is showing. */
  exerciseOptions: string[] | undefined;
  loadingExercise: boolean;
  loadingLessons: boolean;
  addingCustomLesson: boolean;
  customLessonInput: string;
  onCustomLessonInputChange: (value: string) => void;
  onEditStep: (
    stepId: string,
    phaseId: string,
    updates: Partial<RoadmapStep>,
  ) => void;
  onFindExercises: (step: RoadmapStep) => void;
  onSelectExercise: (
    stepId: string,
    phaseId: string,
    exerciseId: string,
  ) => void;
  onFindLessons: (step: RoadmapStep, phase: RoadmapPhase) => void;
  onRemoveLesson: (stepId: string, phaseId: string, videoId: string) => void;
  onAddCustomLesson: (stepId: string, phaseId: string, url: string) => void;
}

/** Everything an author edits on a step: exercise, copy, criteria and lessons. */
export const StepAdminPanel: React.FC<StepAdminPanelProps> = ({
  current,
  lessons,
  exerciseOptions,
  loadingExercise,
  loadingLessons,
  addingCustomLesson,
  customLessonInput,
  onCustomLessonInputChange,
  onEditStep,
  onFindExercises,
  onSelectExercise,
  onFindLessons,
  onRemoveLesson,
  onAddCustomLesson,
}) => {
  const { step, phase } = current;
  const suggested = step.suggestedExerciseId
    ? exercisesAgregat.find((e) => e.id === step.suggestedExerciseId)
    : undefined;

  const customLessonForm = (placeholder: string) => (
    <div className='flex gap-2'>
      <input
        type='text'
        data-vaul-no-drag
        placeholder={placeholder}
        value={customLessonInput}
        onChange={(e) => onCustomLessonInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter")
            onAddCustomLesson(step.id, phase.id, customLessonInput);
        }}
        className={INPUT_CLS}
      />
      <button
        type='button'
        onClick={() => onAddCustomLesson(step.id, phase.id, customLessonInput)}
        disabled={addingCustomLesson}
        className='flex items-center gap-1.5 rounded bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 hover:bg-zinc-700'>
        {addingCustomLesson ? (
          <Loader2 className='h-3 w-3 animate-spin' />
        ) : (
          <FaYoutube className='h-3 w-3 text-red-500' />
        )}
        Add
      </button>
    </div>
  );

  return (
    <div className='flex flex-col gap-6'>
      {/* Exercise */}
      <section className='rounded-lg bg-zinc-900/40 p-5'>
        <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-400'>
          <Dumbbell className='h-3.5 w-3.5 text-cyan-400' /> Exercise
        </h3>
        {loadingExercise ? (
          <div className='flex items-center gap-2 text-xs text-zinc-400'>
            <Loader2 className='h-3.5 w-3.5 animate-spin' /> Searching
            exercises…
          </div>
        ) : exerciseOptions ? (
          <div className='space-y-2'>
            <p className='text-[11px] text-zinc-400'>Pick one:</p>
            {exerciseOptions.map((id) => {
              const ex = exercisesAgregat.find((e) => e.id === id);
              if (!ex) return null;
              return (
                <button
                  key={id}
                  type='button'
                  onClick={() => onSelectExercise(step.id, phase.id, id)}
                  className='flex w-full items-center gap-3 rounded-lg bg-zinc-900 px-3 py-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800'>
                  <Dumbbell className='h-4 w-4 shrink-0 text-cyan-400' />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-semibold text-zinc-100'>
                      {ex.title}
                    </p>
                    {ex.difficulty && (
                      <p className='capitalize text-zinc-400'>
                        {ex.difficulty} · {ex.category}
                      </p>
                    )}
                  </div>
                  <ChevronRight className='h-3.5 w-3.5 shrink-0 text-zinc-500' />
                </button>
              );
            })}
            <button
              type='button'
              onClick={() => onFindExercises(step)}
              className={LINK_BTN_CLS}>
              Search again
            </button>
          </div>
        ) : step.noExercise ? (
          <div className='flex items-center gap-3'>
            <span className='flex items-center gap-1.5 rounded bg-zinc-800/60 px-2.5 py-1.5 text-[11px] text-zinc-400'>
              <X className='h-3 w-3' /> No exercise
            </span>
            <button
              type='button'
              onClick={() =>
                onEditStep(step.id, phase.id, { noExercise: false })
              }
              className={LINK_BTN_CLS}>
              Undo
            </button>
          </div>
        ) : suggested ? (
          <div className='space-y-2'>
            <div className='flex items-center gap-3 rounded-lg bg-cyan-500/10 px-3 py-2.5'>
              <Dumbbell className='h-4 w-4 shrink-0 text-cyan-400' />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-bold text-zinc-100'>
                  {suggested.title}
                </p>
                {suggested.difficulty && (
                  <p className='text-[11px] capitalize text-zinc-400'>
                    {suggested.difficulty} · {suggested.category}
                  </p>
                )}
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={() => onFindExercises(step)}
                className={`flex items-center gap-1 ${LINK_BTN_CLS}`}>
                <RefreshCw className='h-2.5 w-2.5' /> Change exercise
              </button>
              <button
                type='button'
                onClick={() =>
                  onEditStep(step.id, phase.id, {
                    suggestedExerciseId: undefined,
                    noExercise: true,
                  })
                }
                className='text-[11px] text-zinc-500 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:text-red-400'>
                No exercise
              </button>
            </div>
          </div>
        ) : (
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => onFindExercises(step)}
              className={SMALL_BTN_CLS}>
              <Sparkles className='h-3.5 w-3.5' /> Find exercise
            </button>
            <button
              type='button'
              onClick={() =>
                onEditStep(step.id, phase.id, { noExercise: true })
              }
              className={SMALL_BTN_CLS}>
              <X className='h-3.5 w-3.5' /> No exercise
            </button>
          </div>
        )}
      </section>

      {/* Description */}
      <section className='rounded-lg bg-zinc-900/40 p-5'>
        <label className='mb-2 block text-xs font-semibold tracking-wide text-zinc-400'>
          Description
        </label>
        <textarea
          rows={10}
          data-vaul-no-drag
          className={TEXTAREA_CLS}
          value={step.description}
          onChange={(e) =>
            onEditStep(step.id, phase.id, { description: e.target.value })
          }
        />
      </section>

      {/* Success criteria */}
      <section className='rounded-lg bg-cyan-500/10 p-5'>
        <label className='mb-2 block text-xs font-semibold tracking-wide text-cyan-400'>
          Success criteria
        </label>
        <textarea
          rows={3}
          data-vaul-no-drag
          className={TEXTAREA_CLS}
          value={step.successCriteria}
          onChange={(e) =>
            onEditStep(step.id, phase.id, { successCriteria: e.target.value })
          }
        />
      </section>

      {/* Lessons */}
      <section className='rounded-lg bg-zinc-900/40 p-5'>
        <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-400'>
          <FaYoutube className='h-3.5 w-3.5 text-red-500' /> YouTube lessons
        </h3>
        {loadingLessons ? (
          <div className='space-y-2'>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className='h-[92px] animate-pulse rounded-lg bg-zinc-900/60'
              />
            ))}
          </div>
        ) : lessons.length ? (
          <div className='space-y-3'>
            {lessons.map((lesson) => (
              <div key={lesson.videoId} className='group relative'>
                <YouTubeLessonCard lesson={lesson} />
                <button
                  type='button'
                  aria-label='Remove lesson'
                  onClick={() =>
                    onRemoveLesson(step.id, phase.id, lesson.videoId)
                  }
                  className='absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded bg-zinc-800/80 text-zinc-400 opacity-0 transition-colors focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring group-hover:opacity-100 hover:bg-red-900/60 hover:text-red-300'>
                  <X className='h-3 w-3' />
                </button>
              </div>
            ))}
            <button
              type='button'
              onClick={() => onFindLessons(step, phase)}
              className={`flex items-center gap-1 ${LINK_BTN_CLS}`}>
              <RefreshCw className='h-2.5 w-2.5' /> Search again
            </button>
            {customLessonForm("Paste YouTube URL…")}
          </div>
        ) : (
          <div className='space-y-2'>
            <button
              type='button'
              onClick={() => onFindLessons(step, phase)}
              className={SMALL_BTN_CLS}>
              <FaYoutube className='h-3.5 w-3.5 text-red-500' /> Find lessons
            </button>
            {customLessonForm("Or paste YouTube URL…")}
          </div>
        )}
      </section>
    </div>
  );
};
