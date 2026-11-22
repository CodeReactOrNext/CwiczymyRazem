import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { pageTitleClass } from "components/PageTitle/PageTitle";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import { useTranslation } from "hooks/useTranslation";
import { ChevronLeft, ChevronRight, RefreshCw, Target, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import type { YouTubeLessonResult } from "../../../types/youtubeLesson.types";
import type { DescriptionSection } from "../../../utils/parseDescriptionSections";
import { parseDescriptionSections } from "../../../utils/parseDescriptionSections";
import type { StepStatus } from "../../../utils/stepStatus";
import { getResourceProgress, getStepStatus } from "../../../utils/stepStatus";
import { AiGeneratingLoader } from "./AiGeneratingLoader";
import { practiceSteps } from "./StepDescription";
import type { StepDrawerView } from "./StepDrawer";
import { StepResources } from "./StepResources";
import { StepStatusControl } from "./StepStatusControl";

const HOW_TO = /how to (practice|develop|do it)/i;

type LessonPage =
  | { kind: "generating" }
  | { kind: "failed" }
  | { kind: "section"; section: DescriptionSection }
  | { kind: "goal" }
  | { kind: "finish" };

/**
 * One idea per page: each `[Heading]` block of the description, then what
 * "got it" looks like, then the kit to tick off (or the status to set). A step
 * still being written, or one whose copy failed, says so on its first page and
 * keeps the kit at the end, so the exercise is never out of reach.
 */
export const buildRoadmapLessonPages = (view: StepDrawerView): LessonPage[] => {
  const { step } = view.current;
  const pages: LessonPage[] = [];
  if (view.isGenerating) pages.push({ kind: "generating" });
  else if (view.detailFailed || !step.description)
    pages.push({ kind: "failed" });
  else
    parseDescriptionSections(step.description).forEach((section) =>
      pages.push({ kind: "section", section }),
    );
  if (step.successCriteria) pages.push({ kind: "goal" });
  pages.push({ kind: "finish" });
  return pages;
};

/** A description block at lesson size: its heading as the page title, then the text. */
const SectionPage = ({ section }: { section: DescriptionSection }) => {
  const steps =
    section.heading && HOW_TO.test(section.heading)
      ? practiceSteps(section.lines)
      : null;
  return (
    <section className='space-y-5'>
      {section.heading && (
        <h3 className={cn(pageTitleClass, "[text-wrap:balance]")}>
          {section.heading}
        </h3>
      )}
      {steps ? (
        <ol className='space-y-4'>
          {steps.map((sentence, i) => (
            <li
              key={i}
              className='flex items-start gap-4 text-lg leading-relaxed text-zinc-200'>
              <span className='mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold tabular-nums text-zinc-300'>
                {i + 1}
              </span>
              <span>{sentence}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className='space-y-4'>
          {section.lines.map((line, i) =>
            line.startsWith("- ") ? (
              <div
                key={i}
                className='flex items-start gap-4 text-lg leading-relaxed text-zinc-200'>
                <span className='mt-[12px] h-2 w-2 shrink-0 rounded-full bg-zinc-600' />
                <span>{line.slice(2)}</span>
              </div>
            ) : (
              <p key={i} className='text-lg leading-relaxed text-zinc-200'>
                {line}
              </p>
            ),
          )}
        </div>
      )}
    </section>
  );
};

export interface RoadmapStepLessonHandlers {
  onNextStep: (stepId: string) => void;
  onSetStatus: (status: StepStatus) => void;
  onRetryDetail: () => void;
  onOpenExercise: (exerciseId: string) => void;
  onToggleExercise: () => void;
  onOpenSong: (songId: string) => void;
  onToggleSong: () => void;
  onToggleLesson: (videoId: string) => void;
  onPracticeLesson: (lesson: YouTubeLessonResult) => void;
}

interface LessonBodyProps extends RoadmapStepLessonHandlers {
  view: StepDrawerView;
  startAtEnd: boolean;
  onClose: () => void;
}

function LessonBody({
  view,
  startAtEnd,
  onClose,
  onNextStep,
  onSetStatus,
  onRetryDetail,
  onOpenExercise,
  onToggleExercise,
  onOpenSong,
  onToggleSong,
  onToggleLesson,
  onPracticeLesson,
}: LessonBodyProps) {
  const { t } = useTranslation("ai_coach");
  const { step, phase, phaseIdx, stepIdx } = view.current;
  const pages = useMemo(() => buildRoadmapLessonPages(view), [view]);
  const [pageIndex, setPageIndex] = useState(() =>
    startAtEnd ? pages.length - 1 : 0,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // The copy arriving (or failing) changes the page count under the player.
  const current = Math.min(pageIndex, pages.length - 1);
  const page = pages[current];
  const isFirst = current === 0;
  const isLast = current === pages.length - 1;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [current]);

  const goTo = (index: number) =>
    setPageIndex(Math.max(0, Math.min(pages.length - 1, index)));

  // Pages only: the arrows never leave the step (owner's call, 2026-11-22).
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight" && !isLast) goTo(current + 1);
    if (event.key === "ArrowLeft" && !isFirst) goTo(current - 1);
  };

  const resources = getResourceProgress(step, view.lessons);
  const hasKit =
    view.loadingLessons || view.loadingExercise || resources.total > 0;

  let body: React.ReactNode;
  switch (page.kind) {
    case "generating":
      body = <AiGeneratingLoader stepTitle={step.title} />;
      break;
    case "failed":
      body = (
        <div className='flex flex-col items-center gap-3 rounded-lg bg-zinc-900/40 px-6 py-12 text-center'>
          <p className='text-base font-semibold text-zinc-200'>
            {t("drawer.failed_title")}
          </p>
          <p className='text-sm text-zinc-400'>{t("drawer.failed_body")}</p>
          <Button
            type='button'
            variant='subtle'
            onClick={onRetryDetail}
            className='mt-2'>
            <RefreshCw /> {t("drawer.try_again")}
          </Button>
        </div>
      );
      break;
    case "section":
      body = <SectionPage section={page.section} />;
      break;
    case "goal":
      body = (
        <section className='rounded-lg bg-cyan-500/10 p-6'>
          <h3 className='flex items-center gap-2 text-sm font-semibold text-cyan-400'>
            <Target className='h-4 w-4' /> {t("drawer.got_it_when")}
          </h3>
          <p className='mt-3 text-xl font-semibold leading-relaxed text-zinc-50'>
            {step.successCriteria}
          </p>
        </section>
      );
      break;
    case "finish":
      body = hasKit ? (
        <section className='space-y-5'>
          <div className='space-y-2'>
            <h3 className={pageTitleClass}>{t("road.materials")}</h3>
            <p className='text-base text-zinc-400'>
              {t("road.materials_hint")}
            </p>
          </div>
          <StepResources
            step={step}
            lessons={view.lessons}
            loadingLessons={view.loadingLessons}
            loadingExercise={view.loadingExercise}
            onOpenExercise={onOpenExercise}
            onToggleExercise={onToggleExercise}
            onOpenSong={onOpenSong}
            onToggleSong={onToggleSong}
            onToggleLesson={onToggleLesson}
            onPracticeLesson={onPracticeLesson}
          />
        </section>
      ) : (
        <StepStatusControl value={getStepStatus(step)} onChange={onSetStatus} />
      );
      break;
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col' onKeyDown={onKeyDown}>
      {/* ── Top bar: leave, and how far through ── */}
      <div className='flex flex-shrink-0 items-center gap-4 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-6'>
        <DialogPrimitive.Close asChild>
          <Button variant='subtle' size='icon' aria-label={t("drawer.close")}>
            <X />
          </Button>
        </DialogPrimitive.Close>
        <div className='flex flex-1 gap-1' aria-hidden>
          {pages.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= current ? "bg-zinc-200" : "bg-zinc-800",
              )}
            />
          ))}
        </div>
        <span className='text-xs font-medium tabular-nums text-zinc-500'>
          {current + 1} / {pages.length}
        </span>
      </div>

      {/* ── The page ── */}
      <div
        ref={scrollRef}
        className='min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-4 sm:px-8 sm:pt-8'>
        <div className='mx-auto w-full max-w-2xl space-y-7'>
          <header>
            <p className='text-xs font-medium text-zinc-500'>
              {t("phase_n", { n: phaseIdx + 1 })} ·{" "}
              {t("drawer.step_of", {
                step: stepIdx + 1,
                total: phase.steps.length,
              })}
            </p>
            <DialogPrimitive.Title
              className={cn(
                "mt-1 font-display font-black leading-tight text-zinc-100 [text-wrap:balance]",
                isFirst ? "text-3xl sm:text-4xl" : "text-base text-zinc-400",
              )}>
              {step.title}
            </DialogPrimitive.Title>
          </header>
          {body}
        </div>
      </div>

      {/* ── Back / Next, and on the last page the way on ── */}
      <div className='flex-shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-8 sm:pb-8'>
        <div className='mx-auto flex w-full max-w-2xl gap-3'>
          {!isFirst && (
            <Button
              variant='subtle'
              size='icon'
              className='h-10 w-10 flex-shrink-0'
              onClick={() => goTo(current - 1)}
              aria-label={t("road.back")}>
              <ChevronLeft />
            </Button>
          )}

          {!isLast ? (
            <Button
              size='lg'
              className='flex-1 sm:ml-auto sm:flex-none'
              onClick={() => goTo(current + 1)}>
              {t("road.next")}
              <ChevronRight />
            </Button>
          ) : view.next ? (
            <div className='grid flex-1 grid-cols-2 gap-3 sm:ml-auto sm:flex-none'>
              <Button variant='subtle' size='lg' onClick={onClose}>
                {t("road.back_to_map")}
              </Button>
              <Button
                size='lg'
                onClick={() => view.next && onNextStep(view.next.step.id)}>
                {t("road.next_step")}
                <ChevronRight />
              </Button>
            </div>
          ) : (
            <Button
              size='lg'
              className='flex-1 sm:ml-auto sm:flex-none'
              onClick={onClose}>
              {t("road.back_to_map")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface RoadmapStepLessonProps extends RoadmapStepLessonHandlers {
  open: boolean;
  /** Stays set while the lesson fades out, so it never empties mid-animation. */
  view: StepDrawerView | null;
  /** Opens straight on the kit — the bubble's "Materials". */
  startAtEnd: boolean;
  onClose: () => void;
}

/**
 * A roadmap step on the whole screen, the way Journey teaches a step: one idea
 * per page, progress across the top, Back / Next at the bottom, the kit on the
 * last page and the next step after it. Keyed by step, so a new step always
 * opens on its first page.
 */
export const RoadmapStepLesson: React.FC<RoadmapStepLessonProps> = ({
  open,
  view,
  startAtEnd,
  onClose,
  ...handlers
}) => {
  const { isElectron } = useElectronWindowControls();

  return (
    <DialogPrimitive.Root
      open={open && !!view}
      onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            // Over the phone's bottom tab bar (z-[100]) and every in-app dialog
            // layer, under the Electron title bar, which it leaves room for.
            // The lesson practice window (z-[1000]) still opens over it.
            "fixed inset-x-0 bottom-0 z-[120] flex flex-col bg-zinc-950 focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0",
            isElectron ? "top-10" : "top-0",
          )}>
          {view && (
            <LessonBody
              key={`${view.current.step.id}:${startAtEnd ? "end" : "start"}`}
              view={view}
              startAtEnd={startAtEnd}
              onClose={onClose}
              {...handlers}
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
