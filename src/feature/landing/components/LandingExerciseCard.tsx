"use client";

import type { ExerciseCategory } from "feature/exercisePlan/types/exercise.types";
import { TabPreviewGlyph } from "feature/landing/components/TabPreviewGlyph";
import type { TabPreviewNote } from "feature/landing/lib/tabPreview";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface LandingExerciseCardProps {
  exercise: {
    id: string;
    title: string;
    difficulty: "beginner" | "easy" | "medium" | "hard";
    category: string;
    description: string;
    timeInMinutes: number;
    tabPreview?: TabPreviewNote[];
  };
  href: string;
  guideLabel: string;
}

// 1-4 filled dots, brightness scales with difficulty - same "intensity, not
// hue" convention as the activity heatmap elsewhere on the landing page,
// instead of the shared ExerciseCard's per-difficulty rainbow of badge
// colors (rose/emerald/amber/sky), which doesn't fit the landing's
// single-accent system.
const DIFFICULTY_LEVEL: Record<
  LandingExerciseCardProps["exercise"]["difficulty"],
  number
> = {
  beginner: 1,
  easy: 2,
  medium: 3,
  hard: 4,
};

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  technique: "Technique",
  theory: "Theory",
  creativity: "Creativity",
  hearing: "Ear training",
  mixed: "Mixed",
};

const formatDuration = (minutes: number) =>
  minutes < 1 ? `${Math.round(minutes * 60)}s` : `${minutes} min`;

/**
 * Landing-only exercise preview card. Intentionally separate from
 * `feature/exercises/components/ExerciseCard`, which is shared with the
 * logged-in app dashboard and keeps its own multi-color category system -
 * touching it would ripple outside the landing page redesign's scope.
 *
 * The visual anchor is the exercise's own opening bar (`TabPreviewGlyph`),
 * not a category icon: three spider drills used to share one guitar glyph.
 */
export const LandingExerciseCard: React.FC<LandingExerciseCardProps> = ({
  exercise,
  href,
  guideLabel,
}) => {
  const level = DIFFICULTY_LEVEL[exercise.difficulty] ?? 1;
  const category =
    CATEGORY_LABEL[exercise.category as ExerciseCategory] ?? exercise.category;

  return (
    <Link href={href} className='group block h-full'>
      <div className='relative flex h-full flex-col justify-between overflow-hidden rounded-lg p-6 transition-background glass-card hover:glass-card-hover'>
        <div className='pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-500/[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-100' />

        <div className='relative'>
          <div className='mb-6 flex items-center justify-between gap-6'>
            <TabPreviewGlyph
              notes={exercise.tabPreview ?? []}
              className='h-auto w-40 max-w-[60%] opacity-80 transition-opacity duration-300 group-hover:opacity-100'
            />
            <div
              className='flex items-center gap-1'
              aria-label={`Difficulty: ${exercise.difficulty}`}>
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i < level ? "bg-cyan-400" : "bg-zinc-700"
                  }`}
                />
              ))}
            </div>
          </div>

          <h3 className='mb-2 text-lg font-bold tracking-tight text-white transition-colors group-hover:text-cyan-400'>
            {exercise.title}
          </h3>
          <p className='line-clamp-2 text-sm leading-relaxed text-zinc-400'>
            {exercise.description}
          </p>
        </div>

        <div className='relative mt-6 flex items-center justify-between gap-4'>
          <span className='text-xs font-semibold text-zinc-500'>
            <span className='font-teko text-base tabular-nums leading-none text-zinc-400'>
              {formatDuration(exercise.timeInMinutes)}
            </span>
            <span className='mx-1.5'>·</span>
            {category}
          </span>
          <span className='flex items-center gap-1 text-xs font-bold text-cyan-400 transition-transform duration-300 group-hover:translate-x-1'>
            {guideLabel}
            <ArrowRight className='h-3 w-3' />
          </span>
        </div>
      </div>
    </Link>
  );
};
