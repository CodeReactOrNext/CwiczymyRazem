import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';

interface ExerciseCardProps {
  exercise: {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    description: string;
    timeInMinutes: number;
    premium?: boolean;
  };
  href: string;
}

const categoryColors: Record<string, { label: string; color: string; badge: string }> = {
  technique: { label: 'Technique', color: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
  theory: { label: 'Theory', color: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  creativity: { label: 'Creativity', color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  hearing: { label: 'Hearing', color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  mixed: { label: 'Mixed', color: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
};

const difficultyColors: Record<string, string> = {
  easy: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  hard: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, href }) => {
  const categoryInfo = categoryColors[exercise.category] || categoryColors.mixed;
  const difficultyColor = difficultyColors[exercise.difficulty] || '';

  return (
    <Link href={href}>
      <div className="group rounded-2xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all duration-200 p-6 cursor-pointer">
        {/* Badges */}
        <div className="flex gap-2 mb-4">
          <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold border ${categoryInfo.badge}`}>
            {categoryInfo.label}
          </span>
          <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold border capitalize ${difficultyColor}`}>
            {exercise.difficulty}
          </span>
          {exercise.premium && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-yellow-500/20 bg-yellow-500/10 text-yellow-300">
              <Lock className="w-3 h-3" />
              Pro
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
          {exercise.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
          {exercise.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="text-xs text-zinc-500">
            ⏱ {exercise.timeInMinutes} min
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
            Explore <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  );
};
