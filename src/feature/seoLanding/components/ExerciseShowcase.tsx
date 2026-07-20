import { StaticStrumPattern } from "feature/exercises/components/StaticTablature/StaticStrumPattern";
import { StaticTablature } from "feature/exercises/components/StaticTablature/StaticTablature";
import type { SerializedExercise } from "feature/exercises/lib/serializeExercise";
import { idToSlug } from "feature/exercises/lib/slugUtils";
import { ArrowRight, Clock, Music } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { InlineText } from "./InlineText";
import { MountOnVisible } from "./MountOnVisible";

const TablatureViewer = dynamic(
  () =>
    import(
      "feature/exercisePlan/views/PracticeSession/components/TablatureViewer"
    ).then((m) => m.TablatureViewer),
  { ssr: false }
);

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
}

/**
 * One embedded exercise on an SEO landing page: badges + expert commentary +
 * interactive tab preview (lazy) + plain-text tab for crawlers + practice CTA.
 * Anchored by the exercise slug so old /exercises/{slug} redirects can deep-link.
 */
export const ExerciseShowcase = ({
  exercise,
  commentary,
}: ExerciseShowcaseProps) => {
  const slug = idToSlug(exercise.id);
  const difficulty = difficultyBadges[exercise.difficulty];
  const duration =
    exercise.timeInMinutes < 1
      ? `${Math.round(exercise.timeInMinutes * 60)} sec`
      : `${exercise.timeInMinutes} min`;

  return (
    <div id={slug} className='scroll-mt-28 rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <div className='mb-4 flex flex-wrap items-center gap-2'>
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
        <div className='mt-6 space-y-3'>
          <MountOnVisible
            placeholder={
              <div className='h-40 animate-pulse rounded-lg bg-zinc-900/60' />
            }>
            <TablatureViewer
              measures={exercise.tablature}
              bpm={exercise.metronomeSpeed?.recommended || 120}
              isPlaying={false}
              startTime={null}
              countInRemaining={0}
              hideNotes={exercise.hideTablatureNotes}
              hideDynamicsLane={true}
              className='w-full'
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
        <div className='mt-6'>
          <StaticStrumPattern patterns={exercise.strummingPatterns} />
        </div>
      )}

      {exercise.instructions.length > 0 && (
        <div className='mt-6'>
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

      <div className='mt-6'>
        <Link
          href={`/practice/exercise/${slug}`}
          className='inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-400 transition-colors hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500'>
          Practice this with real-time feedback
          <ArrowRight className='h-4 w-4' aria-hidden='true' />
        </Link>
      </div>
    </div>
  );
};
