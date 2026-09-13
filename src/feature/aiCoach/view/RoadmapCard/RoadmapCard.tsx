import { cn } from "assets/lib/utils";
import type { Roadmap } from "feature/aiCoach/types/roadmap.types";
import {
  flattenRoadmapSteps,
  getNextUnfinishedStep,
} from "feature/aiCoach/utils/roadmapSteps";
import { getStepStatus } from "feature/aiCoach/utils/stepStatus";
import { ArrowUpRight, Check, Guitar } from "lucide-react";
import Image from "next/image";

interface RoadmapCardProps {
  roadmap: Roadmap;
  onOpen: () => void;
}

const LEVEL_THEME: Record<string, string> = {
  "Absolute Beginner": "text-cyan-300",
  Beginner: "text-emerald-300",
  Intermediate: "text-amber-300",
  Advanced: "text-purple-300",
};

const RoadmapCard = ({ roadmap, onOpen }: RoadmapCardProps) => {
  const steps = flattenRoadmapSteps(roadmap.phases);
  const done = steps.filter(
    ({ step }) => getStepStatus(step) === "done",
  ).length;
  const total = steps.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  const started = steps.some(({ step }) => step.sessionsCompleted > 0);
  const nextStep = getNextUnfinishedStep(steps);
  const shortTitle = roadmap.title.replace(
    /^(?:I want to play in the style of |Play in the style of |I want to play like )/i,
    "",
  );
  const artistRoadmap = shortTitle !== roadmap.title;
  const action = complete
    ? "Review roadmap"
    : started
      ? "Continue"
      : "Start learning";

  return (
    <article className='group relative isolate flex min-w-0 flex-col overflow-hidden rounded-lg bg-zinc-900 transition-colors focus-within:ring-2 focus-within:ring-cyan-400 hover:bg-zinc-800/80'>
      <div className='relative min-h-64 overflow-hidden bg-zinc-800 sm:min-h-72'>
        {roadmap.image ? (
          <Image
            src={roadmap.image}
            alt=''
            fill
            sizes='(min-width: 1024px) 45vw, 100vw'
            className='object-cover object-[center_30%]'
          />
        ) : (
          <Guitar
            aria-hidden='true'
            className='absolute right-8 top-8 h-32 w-32 text-zinc-700'
            strokeWidth={1}
          />
        )}
        <div className='absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent' />
        <div className='absolute inset-x-5 top-5 flex flex-wrap items-center justify-between gap-2 sm:inset-x-6'>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded bg-zinc-950/85 px-3 py-1.5 text-sm font-medium",
              LEVEL_THEME[roadmap.level] ?? "text-zinc-200",
            )}>
            <span
              aria-hidden='true'
              className='h-1.5 w-1.5 rounded-full bg-current'
            />
            {roadmap.level}
          </span>
          {complete && (
            <span className='inline-flex items-center gap-1.5 rounded bg-zinc-950/85 px-3 py-1.5 text-sm font-medium text-emerald-300'>
              <Check aria-hidden='true' className='h-4 w-4' />
              Completed
            </span>
          )}
        </div>
        <div className='absolute inset-x-5 bottom-6 sm:inset-x-6'>
          <p className='mb-2 text-sm font-medium text-zinc-300'>
            {artistRoadmap ? "Play in the style of" : "Mastery roadmap"}
          </p>
          <h2 className='break-words font-display text-3xl font-bold leading-tight tracking-tight text-zinc-100 sm:text-4xl'>
            {shortTitle}
          </h2>
        </div>
      </div>
      <div className='flex flex-1 flex-col gap-5 p-5 sm:p-6'>
        <div className='flex items-center justify-between gap-4 text-sm'>
          <span className='text-zinc-400'>{roadmap.phases.length} phases</span>
          <span
            className={cn(
              "tabular-nums text-zinc-300",
              complete && "text-emerald-300",
            )}>
            {done} / {total} steps
          </span>
        </div>
        <div
          role='progressbar'
          aria-label={`${shortTitle} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={`${done} of ${total} steps completed`}
          className='h-1 overflow-hidden rounded-full bg-zinc-700/60'>
          <div
            className={cn(
              "h-full rounded-full bg-cyan-400",
              complete && "bg-emerald-400",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        {roadmap.goal && roadmap.goal !== roadmap.title && (
          <p className='text-sm leading-relaxed text-zinc-400'>
            {roadmap.goal}
          </p>
        )}
        <div className='min-h-14'>
          <p className='mb-1 text-sm text-zinc-400'>
            {complete
              ? "All steps completed"
              : started
                ? "Up next"
                : "Your first step"}
          </p>
          <p className='line-clamp-2 text-sm font-medium leading-relaxed text-zinc-200'>
            {nextStep?.step.title ??
              (complete
                ? "Revisit a favourite lesson or keep practising."
                : "Explore the roadmap.")}
          </p>
        </div>
        <div className='mt-auto flex flex-wrap items-center justify-between gap-3'>
          <span className='text-sm tabular-nums text-zinc-400'>
            {started ? `${progress}% complete` : "Ready when you are"}
          </span>
          <button
            type='button'
            onClick={onOpen}
            aria-label={`${action}: ${shortTitle}`}
            className='inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-zinc-800 px-4 text-sm font-semibold text-zinc-100 transition-colors after:absolute after:inset-0 focus-visible:bg-zinc-700 focus-visible:outline-none group-hover:bg-zinc-700'>
            {action}
            <ArrowUpRight
              aria-hidden='true'
              className='h-4 w-4 text-zinc-400'
            />
          </button>
        </div>
      </div>
    </article>
  );
};

export default RoadmapCard;
