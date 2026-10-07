import { cn } from "assets/lib/utils";
import type { Roadmap } from "feature/aiCoach/types/roadmap.types";
import {
  flattenRoadmapSteps,
  getNextUnfinishedStep,
} from "feature/aiCoach/utils/roadmapSteps";
import { getStepStatus } from "feature/aiCoach/utils/stepStatus";
import { shortRoadmapTitle } from "feature/practice/utils/modeProgress";
import { useTranslation } from "hooks/useTranslation";
import { ArrowRight, Check, Guitar } from "lucide-react";
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
  const { t } = useTranslation("ai_coach");
  const steps = flattenRoadmapSteps(roadmap.phases);
  const done = steps.filter(
    ({ step }) => getStepStatus(step) === "done",
  ).length;
  const total = steps.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  const started = steps.some(({ step }) => step.sessionsCompleted > 0);
  const nextStep = getNextUnfinishedStep(steps);
  const shortTitle = shortRoadmapTitle(roadmap.title);
  const artistRoadmap = shortTitle !== roadmap.title;
  const action = complete
    ? t("card.review")
    : started
      ? t("card.continue")
      : t("card.start");

  return (
    <article className='group relative isolate flex min-w-0 flex-col overflow-hidden rounded-lg bg-zinc-900 transition-colors focus-within:ring-2 focus-within:ring-cyan-400 hover:bg-zinc-800/80 sm:flex-row'>
      {/* A thumbnail, not a poster: the name, scope and first lesson stay in view. */}
      <div className='relative h-32 shrink-0 overflow-hidden bg-zinc-800 sm:h-auto sm:w-40'>
        {roadmap.image ? (
          <Image
            src={roadmap.image}
            alt=''
            fill
            sizes='(min-width: 640px) 160px, 100vw'
            className='object-cover object-[center_30%]'
          />
        ) : (
          <Guitar
            aria-hidden='true'
            className='absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-zinc-700'
            strokeWidth={1}
          />
        )}
      </div>

      <div className='flex flex-1 flex-col gap-5 p-5 sm:p-6'>
        <div>
          <p className='text-sm text-zinc-400'>
            {artistRoadmap ? t("card.in_style_of") : t("mastery_roadmap")}
          </p>
          <h2 className='mt-1 break-words text-2xl font-bold leading-tight tracking-tight text-zinc-100'>
            {shortTitle}
          </h2>
          <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm'>
            <span
              className={cn(
                "inline-flex items-center gap-2 font-medium",
                LEVEL_THEME[roadmap.level] ?? "text-zinc-200",
              )}>
              <span
                aria-hidden='true'
                className='h-1.5 w-1.5 rounded-full bg-current'
              />
              {t(`levels.${roadmap.level}`, roadmap.level)}
            </span>
            <span className='tabular-nums text-zinc-400'>
              {t("phases_steps", {
                phases: roadmap.phases.length,
                steps: total,
              })}
            </span>
            {complete && (
              <span className='inline-flex items-center gap-1.5 font-medium text-emerald-300'>
                <Check aria-hidden='true' className='h-4 w-4' />
                {t("card.completed")}
              </span>
            )}
          </div>
        </div>

        {roadmap.goal && roadmap.goal !== roadmap.title && (
          <p className='line-clamp-2 text-sm leading-relaxed text-zinc-400'>
            {roadmap.goal}
          </p>
        )}

        {started && (
          <div className='flex items-center gap-3'>
            <div
              role='progressbar'
              aria-label={t("card.progress", { title: shortTitle })}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-valuetext={t("card.steps_done", { done, total })}
              className='h-1 flex-1 overflow-hidden rounded-full bg-zinc-700/60'>
              <div
                className={cn(
                  "h-full rounded-full bg-cyan-400",
                  complete && "bg-emerald-400",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span
              className={cn(
                "text-sm tabular-nums text-zinc-300",
                complete && "text-emerald-300",
              )}>
              {done} / {total}
            </span>
          </div>
        )}

        <div className='mt-auto flex flex-wrap items-end justify-between gap-4'>
          <div className='min-w-0 flex-1 basis-48'>
            <p className='mb-1 text-sm text-zinc-400'>
              {complete
                ? t("card.all_done")
                : started
                  ? t("card.up_next")
                  : t("card.first_step")}
            </p>
            <p className='line-clamp-2 text-sm font-medium leading-relaxed text-zinc-200'>
              {nextStep?.step.title ??
                (complete ? t("card.revisit") : t("card.explore"))}
            </p>
          </div>
          <button
            type='button'
            onClick={onOpen}
            aria-label={`${action}: ${shortTitle}`}
            className='inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors after:absolute after:inset-0 focus-visible:bg-zinc-200 focus-visible:outline-none group-hover:bg-zinc-200'>
            {action}
            <ArrowRight aria-hidden='true' className='h-4 w-4' />
          </button>
        </div>
      </div>
    </article>
  );
};

export default RoadmapCard;
