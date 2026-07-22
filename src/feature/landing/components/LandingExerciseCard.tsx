"use client";

import { ArrowRight, Guitar } from "lucide-react";
import Link from "next/link";

interface LandingExerciseCardProps {
  exercise: {
    id: string;
    title: string;
    difficulty: "beginner" | "easy" | "medium" | "hard";
    category: string;
    description: string;
    timeInMinutes: number;
  };
  href: string;
}

// 1-4 filled dots, brightness scales with difficulty - same "intensity, not
// hue" convention as the activity heatmap elsewhere on the landing page,
// instead of the shared ExerciseCard's per-difficulty rainbow of badge
// colors (rose/emerald/amber/sky), which doesn't fit the landing's
// single-accent system.
const DIFFICULTY_LEVEL: Record<LandingExerciseCardProps["exercise"]["difficulty"], number> = {
  beginner: 1,
  easy: 2,
  medium: 3,
  hard: 4,
};

/**
 * Landing-only exercise preview card. Intentionally separate from
 * `feature/exercises/components/ExerciseCard`, which is shared with the
 * logged-in app dashboard and keeps its own multi-color category system -
 * touching it would ripple outside the landing page redesign's scope.
 */
export const LandingExerciseCard: React.FC<LandingExerciseCardProps> = ({
  exercise,
  href,
}) => {
  const level = DIFFICULTY_LEVEL[exercise.difficulty] ?? 1;

  return (
    <Link href={href} className='group block'>
      <div className='relative flex h-full flex-col justify-between overflow-hidden rounded-lg glass-card p-6 transition-background hover:glass-card-hover'>
        <div className='pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-500/[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-100' />

        <div className='relative'>
          <div className='mb-5 flex items-center justify-between'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 transition-transform duration-300 group-hover:scale-105'>
              <Guitar className='h-5 w-5' />
            </div>
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
          <p className='text-sm leading-relaxed text-zinc-400 line-clamp-2'>
            {exercise.description}
          </p>
        </div>

        <div className='relative mt-6 flex items-center justify-between'>
          <span className='text-xs font-semibold text-zinc-500'>
            {exercise.timeInMinutes < 1
              ? `${Math.round(exercise.timeInMinutes * 60)}s`
              : `${exercise.timeInMinutes} min`}
          </span>
          <span className='flex items-center gap-1 text-xs font-bold text-cyan-400 transition-transform duration-300 group-hover:translate-x-1'>
            Explore
            <ArrowRight className='h-3 w-3' />
          </span>
        </div>
      </div>
    </Link>
  );
};
