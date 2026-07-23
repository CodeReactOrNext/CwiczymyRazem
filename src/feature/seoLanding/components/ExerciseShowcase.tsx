import { StaticStrumPattern } from "feature/exercises/components/StaticTablature/StaticStrumPattern";
import { StaticTablature } from "feature/exercises/components/StaticTablature/StaticTablature";
import type { SerializedExercise } from "feature/exercises/lib/serializeExercise";
import { idToSlug } from "feature/exercises/lib/slugUtils";
import { ArrowRight, Clock, Music } from "lucide-react";
import Link from "next/link";

import { InlineText } from "./InlineText";
import { MountOnVisible } from "./MountOnVisible";
import { NotationPreview } from "./NotationPreview";

const difficultyBadges: Record<string, { label: string; className: string }> = {
  beginner: { label: "Beginner", className: "bg-sky-500/10 text-sky-300" },
  easy: { label: "Easy", className: "bg-emerald-500/10 text-emerald-300" },
  medium: { label: "Medium", className: "bg-amber-500/10 text-amber-300" },
  hard: { label: "Hard", className: "bg-rose-500/10 text-rose-300" },
};

interface ExerciseShowcaseProps {
  exercise: SerializedExercise;
  /** Expert commentary paragraphs written for the landing page context. */
  commentary: string[];
  /** 1-based position of this drill among all embeds on the page. */
  position?: number;
  /** Total number of embedded drills on the page. */
  total?: number;
}

/**
 * One embedded exercise on an SEO landing page: badges + expert commentary +
 * real notation rendered by AlphaTab (lazy) + plain-text tab for crawlers +
 * practice CTA. Anchored by the exercise slug so old /exercises/{slug}
 * redirects can deep-link.
 */
export const ExerciseShowcase = ({
  exercise,
  commentary,
  position,
  total,
}: ExerciseShowcaseProps) => {
  const slug = idToSlug(exercise.id);
  const difficulty = difficultyBadges[exercise.difficulty];
  const duration =
    exercise.timeInMinutes < 1
      ? `${Math.round(exercise.timeInMinutes * 60)} sec`
      : `${exercise.timeInMinutes} min`;

  return (
    <div id={slug} className='scroll-mt-28 rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <div className='mb-5 flex flex-wrap items-center gap-2'>
        {position !== undefined && total !== undefined && (
          <span className='rounded bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-400'>
            Drill {position} of {total}
          </span>
        )}
        <span
          className={`inline-block rounded px-2.5 py-1 text-xs font-semibold ${difficulty.className}`}>
          {difficulty.label}
        </span>
        <span className='inline-flex items-center gap-1.5 rounded bg-zinc-800/60 px-2.5 py-1 text-xs font-semibold text-zinc-300'>
          <Clock className='h-3 w-3 text-zinc-400' aria-hidden='true' />
          {duration}
        </span>
        {exercise.metronomeSpeed && (
          <span className='inline-flex items-center gap-1.5 rounded bg-zinc-800/60 px-2.5 py-1 text-xs font-semibold text-zinc-300'>
            <Music className='h-3 w-3 text-zinc-400' aria-hidden='true' />
            {exercise.metronomeSpeed.min}–{exercise.metronomeSpeed.max} BPM
          </span>
        )}
      </div>

      <h3 className='mb-2 text-2xl font-bold tracking-tight text-white'>
        {exercise.title}
      </h3>
      <p className='mb-5 leading-relaxed text-zinc-400'>{exercise.description}</p>

      <div className='space-y-4'>
        {commentary.map((paragraph, idx) => (
          <p key={idx} className='leading-relaxed text-zinc-300'>
            <InlineText text={paragraph} />
          </p>
        ))}
      </div>

      {exercise.tablature && (
        <div className='mt-8 space-y-3'>
          <MountOnVisible
            placeholder={
              <div className='min-h-[180px] animate-pulse rounded-lg bg-zinc-950/70' />
            }>
            <NotationPreview
              measures={exercise.tablature}
              bpm={exercise.metronomeSpeed?.recommended || 120}
            />
          </MountOnVisible>
          <details className='group'>
            <summary className='cursor-pointer text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-300'>
              Show plain-text tab
            </summary>
            <StaticTablature
              measures={exercise.tablature}
              maxMeasures={4}
              className='mt-3'
            />
          </details>
        </div>
      )}

      {!exercise.tablature && exercise.strummingPatterns && (
        <div className='mt-8'>
          <StaticStrumPattern patterns={exercise.strummingPatterns} />
        </div>
      )}

      {exercise.instructions.length > 0 && (
        <div className='mt-8'>
          <p className='mb-3 text-sm font-semibold text-zinc-200'>
            How to practice it
          </p>
          <ol className='space-y-2'>
            {exercise.instructions.map((instruction, idx) => (
              <li key={idx} className='flex gap-3 text-sm'>
                <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-500/15 text-xs font-bold text-cyan-400'>
                  {idx + 1}
                </span>
                <span className='leading-relaxed text-zinc-400'>
                  {instruction}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className='mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
        <Link
          href={`/practice/exercise/${slug}`}
          className='inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300'>
          Practice this with real-time feedback
          <ArrowRight className='h-4 w-4' aria-hidden='true' />
        </Link>
        <span className='text-xs font-medium text-zinc-400'>
          Free, right in your browser
        </span>
      </div>
    </div>
  );
};
