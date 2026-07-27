import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, Clock, Headphones, Hexagon, ListChecks, Star, Timer } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

// Mirrors feature/exercisePlan/data/planAppearance.ts (icon + color ids) and the
// footer layout of feature/exercisePlan/components/PlanCard.tsx, stripped down to
// a static, non-interactive card for MDX blog content. Props stay plain strings —
// MDX content compiles with no scope, so `{expression}` attributes would throw.
interface PracticePlanCardProps {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  minutes: string;
  exercises: string;
  icon?: string;
  color?: string;
  href?: string;
}

const ICONS: Record<string, LucideIcon> = {
  star: Star,
  timer: Timer,
  headphones: Headphones,
  hexagon: Hexagon,
};

const COLORS: Record<string, { iconTile: string; glow: string }> = {
  teal: { iconTile: 'bg-teal-500/10 text-teal-400', glow: 'bg-teal-500/20' },
  amber: { iconTile: 'bg-amber-500/10 text-amber-400', glow: 'bg-amber-500/20' },
  emerald: { iconTile: 'bg-emerald-500/10 text-emerald-400', glow: 'bg-emerald-500/20' },
  blue: { iconTile: 'bg-blue-500/10 text-blue-400', glow: 'bg-blue-500/20' },
};

export const PracticePlanCard = ({
  title,
  description,
  category,
  difficulty,
  minutes,
  exercises,
  icon = 'star',
  color = 'teal',
  href = '/signup',
}: PracticePlanCardProps) => {
  const Icon = ICONS[icon] ?? Star;
  const style = COLORS[color] ?? COLORS.teal;

  return (
    <Link
      href={href}
      className="not-prose group relative my-6 flex flex-col overflow-hidden rounded-lg bg-zinc-900/40 p-5 no-underline transition-colors hover:bg-zinc-900/60"
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-3xl ${style.glow}`}
      />

      <div className="relative mb-3 flex items-center gap-2.5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded ${style.iconTile}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] font-medium capitalize tracking-wide text-zinc-300">{category}</span>
        <span className="text-[11px] font-medium capitalize tracking-wide text-zinc-500">{difficulty}</span>
      </div>

      <div className="relative">
        <h4 className="m-0 text-[17px] font-bold leading-tight tracking-tight text-white">{title}</h4>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">{description}</p>
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span>{minutes} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <ListChecks className="h-3.5 w-3.5 text-zinc-500" />
            <span>{exercises}</span>
          </div>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-200 transition-colors group-hover:bg-cyan-500 group-hover:text-zinc-950">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
};
