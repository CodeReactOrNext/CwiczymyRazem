"use client";

import { ExerciseCard } from 'feature/exercises/components/ExerciseCard/ExerciseCard';
import { idToSlug } from 'feature/exercises/lib/slugUtils';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ExerciseCatalogPreviewProps {
  exercises: Array<{
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    description: string;
    timeInMinutes: number;
  }>;
}

export const ExerciseCatalogPreview: React.FC<ExerciseCatalogPreviewProps> = ({
  exercises,
}) => {
  return (
    <section className="relative py-32 bg-zinc-950 overflow-hidden">
      {/* Background ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[700px] h-[700px] bg-cyan-500/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-sky-500/5 blur-[130px] rounded-full" />
      </div>

      {/* Top divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400 mb-4 block">
            Exercise Catalog
          </span>

          <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display mb-6">
            Hundreds of exercises<br />
            <span className="text-zinc-500">ready to learn</span>
          </h2>

          <p className="text-zinc-400 text-lg leading-relaxed mb-4">
            Browse our complete library of professional guitar exercises, organized by skill category and difficulty. Each one comes with interactive tablature and audio playback.
          </p>

          <Link href="/exercises" className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm inline-flex items-center gap-1 transition-colors">
            Explore all exercises
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {exercises.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                href={`/exercises/${idToSlug(ex.id)}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
