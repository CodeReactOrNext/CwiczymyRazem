"use client";

import { LandingExerciseCard } from "feature/landing/components/LandingExerciseCard";
import { Reveal } from "feature/landing/components/Reveal";
import { getExerciseLandingHref } from "lib/exerciseLandingLink";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ExerciseCatalogPreviewProps {
  exercises: Array<{
    id: string;
    title: string;
    difficulty: "beginner" | "easy" | "medium" | "hard";
    category: string;
    description: string;
    timeInMinutes: number;
  }>;
}

export const ExerciseCatalogPreview: React.FC<ExerciseCatalogPreviewProps> = ({
  exercises,
}) => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-24'>
      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute right-0 top-1/3 h-[700px] w-[700px] rounded-full bg-cyan-500/5 blur-[160px]' />
        <div className='absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.03] blur-[130px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <Reveal className='mx-auto mb-12 max-w-2xl text-center'>
          <h2 className='mb-6 font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
            144 exercises ready to learn
          </h2>

          <p className='mb-4 text-lg leading-relaxed text-zinc-400'>
            Browse the complete library, organized by skill category and
            difficulty. Each exercise comes with interactive tablature and audio
            playback.
          </p>

          <Link
            href='/beginner-guitar-exercises'
            className='inline-flex items-center gap-1 text-sm font-semibold text-cyan-400 transition-colors hover:text-cyan-300'>
            Explore the free practice guides
            <ArrowRight className='h-3.5 w-3.5' />
          </Link>
        </Reveal>

        {exercises.length > 0 && (
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {exercises.map((ex, i) => (
              <Reveal key={ex.id} delay={i * 0.06} className='h-full'>
                <LandingExerciseCard
                  exercise={ex}
                  href={getExerciseLandingHref(ex.id, ex)}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
