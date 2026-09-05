import { Chip } from "assets/components/ui/chip";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "assets/components/ui/drawer";
import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw, Target, X } from "lucide-react";
import React, { useEffect, useRef } from "react";

import type { YouTubeLessonResult } from "../../../types/youtubeLesson.types";
import type { RoadmapStepRef } from "../../../utils/roadmapSteps";
import type { StepStatus } from "../../../utils/stepStatus";
import { getResourceProgress, getStepStatus } from "../../../utils/stepStatus";
import { AiGeneratingLoader } from "./AiGeneratingLoader";
import type { StepAdminPanelProps } from "./StepAdminPanel";
import { StepAdminPanel } from "./StepAdminPanel";
import { StepDescription } from "./StepDescription";
import { StepResources } from "./StepResources";
import { StepStatusControl } from "./StepStatusControl";

const STATUS_CHIP: Record<
  StepStatus,
  { label: string; color: "gray" | "amber" | "emerald"; dot: string }
> = {
  "not-started": { label: "Not started", color: "gray", dot: "bg-zinc-500" },
  "in-progress": { label: "In progress", color: "amber", dot: "bg-amber-400" },
  done: { label: "Done", color: "emerald", dot: "bg-emerald-400" },
};

const SEGMENT_CLS: Record<StepStatus, string> = {
  "not-started": "bg-zinc-800",
  "in-progress": "bg-amber-400",
  done: "bg-emerald-500",
};

/** Everything the drawer shows for one step. */
export interface StepDrawerView {
  current: RoadmapStepRef;
  prev: RoadmapStepRef | null;
  next: RoadmapStepRef | null;
  lessons: YouTubeLessonResult[];
  /** The coach is still writing this step's details. */
  isGenerating: boolean;
  /** Writing the details failed; the player can retry. */
  detailFailed: boolean;
  loadingLessons: boolean;
  loadingExercise: boolean;
}

export type StepDrawerAdminProps = Omit<
  StepAdminPanelProps,
  "current" | "lessons" | "loadingExercise" | "loadingLessons"
> & {
  onRegenerate: (ref: RoadmapStepRef) => void;
};

interface StepDrawerProps {
  open: boolean;
  /** Stays set while the drawer slides out, so the panel never empties mid-animation. */
  view: StepDrawerView | null;
  /** Pauses the arrow keys while something else (the practice window) owns the keyboard. */
  navigationLocked?: boolean;
  onClose: () => void;
  onNavigate: (stepId: string) => void;
  onSetStatus: (status: StepStatus) => void;
  onRetryDetail: () => void;
  onOpenExercise: (exerciseId: string) => void;
  onToggleExercise: () => void;
  onToggleLesson: (videoId: string) => void;
  onPracticeLesson: (lesson: YouTubeLessonResult) => void;
  admin?: StepDrawerAdminProps;
}

interface NavButtonProps {
  direction: "prev" | "next";
  target: RoadmapStepRef | null;
  onClick: () => void;
}

const NavButton = ({ direction, target, onClick }: NavButtonProps) => {
  const isNext = direction === "next";
  const Icon = isNext ? ChevronRight : ChevronLeft;
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={!target}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-lg bg-zinc-900/40 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 hover:bg-zinc-800/60",
        isNext && "flex-row-reverse text-right",
      )}>
      <Icon className='h-4 w-4 shrink-0 text-zinc-400' />
      <span className='min-w-0 flex-1'>
        <span className='block text-[11px] font-semibold text-zinc-500'>
          {isNext ? "Next" : "Previous"}
        </span>
        <span className='block truncate text-sm font-semibold text-zinc-200'>
          {target
            ? target.step.title
            : isNext
              ? "End of roadmap"
              : "Start of roadmap"}
        </span>
      </span>
    </button>
  );
};

interface StepDrawerBodyProps extends Omit<
  StepDrawerProps,
  "open" | "view" | "onClose" | "navigationLocked"
> {
  view: StepDrawerView;
  bodyRef: React.RefObject<HTMLDivElement | null>;
}

const StepDrawerBody = ({
  view,
  bodyRef,
  onNavigate,
  onSetStatus,
  onRetryDetail,
  onOpenExercise,
  onToggleExercise,
  onToggleLesson,
  onPracticeLesson,
  admin,
}: StepDrawerBodyProps) => {
  const {
    current,
    prev,
    next,
    lessons,
    isGenerating,
    detailFailed,
    loadingLessons,
    loadingExercise,
  } = view;
  const { step, phase, stepIdx, phaseIdx } = current;
  const status = getStepStatus(step);
  const chip = STATUS_CHIP[status];
  const resources = getResourceProgress(step, lessons);
  const hasKit = loadingLessons || loadingExercise || resources.total > 0;

  let body: React.ReactNode;
  if (isGenerating) {
    body = <AiGeneratingLoader stepTitle={step.title} />;
  } else if (admin) {
    const { onRegenerate: _onRegenerate, ...panel } = admin;
    body = (
      <StepAdminPanel
        current={current}
        lessons={lessons}
        loadingExercise={loadingExercise}
        loadingLessons={loadingLessons}
        {...panel}
      />
    );
  } else if (detailFailed || !step.description) {
    body = (
      <div className='flex flex-col items-center gap-3 rounded-lg bg-zinc-900/40 px-6 py-12 text-center'>
        <p className='text-sm font-semibold text-zinc-200'>
          The details didn&apos;t come through
        </p>
        <p className='text-xs text-zinc-400'>
          The coach couldn&apos;t write this step just now.
        </p>
        <button
          type='button'
          onClick={onRetryDetail}
          className='mt-2 flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-700'>
          <RefreshCw className='h-3.5 w-3.5' /> Try again
        </button>
      </div>
    );
  } else {
    body = (
      <>
        <StepDescription description={step.description} />

        {step.successCriteria && (
          <section className='rounded-lg bg-cyan-500/10 p-5'>
            <h3 className='flex items-center gap-2 text-xs font-semibold tracking-wide text-cyan-400'>
              <Target className='h-3.5 w-3.5' /> You&apos;ve got it when
            </h3>
            <p className='mt-3 text-sm leading-relaxed text-zinc-200'>
              {step.successCriteria}
            </p>
          </section>
        )}

        {hasKit ? (
          <StepResources
            step={step}
            lessons={lessons}
            loadingLessons={loadingLessons}
            loadingExercise={loadingExercise}
            onOpenExercise={onOpenExercise}
            onToggleExercise={onToggleExercise}
            onToggleLesson={onToggleLesson}
            onPracticeLesson={onPracticeLesson}
          />
        ) : (
          <StepStatusControl value={status} onChange={onSetStatus} />
        )}
      </>
    );
  }

  return (
    <div className='flex h-full min-h-0 flex-col'>
      {/* Header */}
      <header className='flex flex-col gap-4 px-5 pb-5 pt-5 sm:px-7 sm:pt-6'>
        <div className='flex items-center justify-between gap-3'>
          <p className='truncate text-xs font-semibold text-zinc-400'>
            Phase {phaseIdx + 1} · {phase.title}
          </p>
          <div className='flex shrink-0 items-center gap-1'>
            {admin && step.description && !isGenerating && (
              <button
                type='button'
                onClick={() => admin.onRegenerate(current)}
                className='flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100'>
                <RefreshCw className='h-3.5 w-3.5' /> Regenerate
              </button>
            )}
            <DrawerClose asChild>
              <button
                type='button'
                aria-label='Close'
                className='flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-100'>
                <X className='h-4 w-4' />
              </button>
            </DrawerClose>
          </div>
        </div>

        <div className='flex flex-col gap-3'>
          <DrawerTitle className='font-display text-xl font-bold leading-snug tracking-normal text-zinc-100 sm:text-2xl'>
            {step.title}
          </DrawerTitle>
          <DrawerDescription className='sr-only'>
            Step {stepIdx + 1} of {phase.steps.length} in phase {phaseIdx + 1},{" "}
            {phase.title}.
          </DrawerDescription>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <Chip color={chip.color}>
              <span className={cn("h-1.5 w-1.5 rounded-full", chip.dot)} />
              {chip.label}
            </Chip>
            <span className='text-xs text-zinc-400'>
              Step {stepIdx + 1} of {phase.steps.length}
            </span>
            {resources.total > 0 && (
              <span className='text-xs tabular-nums text-zinc-400'>
                {resources.completed}/{resources.total} resources
              </span>
            )}
          </div>
        </div>

        {/* This phase, one segment per step; the open one stands taller. */}
        <div className='flex items-center gap-1' aria-hidden>
          {phase.steps.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "flex-1 rounded-full transition-colors",
                i === stepIdx ? "h-2" : "h-1",
                SEGMENT_CLS[getStepStatus(s)],
                i === stepIdx &&
                  getStepStatus(s) === "not-started" &&
                  "bg-zinc-500",
              )}
            />
          ))}
        </div>
      </header>

      {/* Body */}
      <div
        ref={bodyRef}
        className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-1 sm:px-7'>
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className='flex flex-col gap-8'>
            {body}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className='grid grid-cols-2 gap-2 px-5 py-4 sm:px-7'>
        <NavButton
          direction='prev'
          target={prev}
          onClick={() => prev && onNavigate(prev.step.id)}
        />
        <NavButton
          direction='next'
          target={next}
          onClick={() => next && onNavigate(next.step.id)}
        />
      </footer>
    </div>
  );
};

/**
 * One step of the roadmap, in a panel that slides in from the right and leaves
 * the map visible behind it. Prev/next (and the arrow keys) walk the whole
 * roadmap without closing, so working through a phase is a series of taps, not
 * a series of open-scroll-find-click loops.
 */
export const StepDrawer: React.FC<StepDrawerProps> = ({
  open,
  view,
  navigationLocked = false,
  onClose,
  onNavigate,
  onSetStatus,
  onRetryDetail,
  onOpenExercise,
  onToggleExercise,
  onToggleLesson,
  onPracticeLesson,
  admin,
}) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const stepId = view?.current.step.id;
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [stepId]);

  const prevId = view?.prev?.step.id ?? null;
  const nextId = view?.next?.step.id ?? null;
  useEffect(() => {
    if (!open || navigationLocked) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft" && prevId) {
        event.preventDefault();
        onNavigate(prevId);
      } else if (event.key === "ArrowRight" && nextId) {
        event.preventDefault();
        onNavigate(nextId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, navigationLocked, prevId, nextId, onNavigate]);

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      direction='right'
      shouldScaleBackground={false}>
      <DrawerContent
        hideHandle
        overlayClassName='bg-black/60'
        className='bottom-[calc(58px_+_env(safe-area-inset-bottom,0px))] left-auto right-0 top-0 mt-0 h-auto w-full max-w-xl rounded-none border-0 bg-zinc-950 outline-none lg:bottom-0'>
        {view && (
          <StepDrawerBody
            view={view}
            bodyRef={bodyRef}
            onNavigate={onNavigate}
            onSetStatus={onSetStatus}
            onRetryDetail={onRetryDetail}
            onOpenExercise={onOpenExercise}
            onToggleExercise={onToggleExercise}
            onToggleLesson={onToggleLesson}
            onPracticeLesson={onPracticeLesson}
            admin={admin}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
};
