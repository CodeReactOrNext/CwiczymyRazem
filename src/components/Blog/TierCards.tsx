import { Flame, Sprout, Trophy } from 'lucide-react';
import React from 'react';

interface Tier {
  icon: React.ElementType;
  badgeClass: string;
  title: string;
  time: string;
  description: string;
}

const tiers: Tier[] = [
  {
    icon: Sprout,
    badgeClass: 'bg-emerald-500/10 text-emerald-300',
    title: 'Beginners',
    time: '15–30 min/day',
    description: '4–6 days a week. Focus on chords and finger exercises.',
  },
  {
    icon: Flame,
    badgeClass: 'bg-amber-500/10 text-amber-300',
    title: 'Intermediate',
    time: '60–90 min/day',
    description: '5–6 days a week. Focused chunks for barre chords, scales, rhythm.',
  },
  {
    icon: Trophy,
    badgeClass: 'bg-purple-500/10 text-purple-300',
    title: 'Advanced',
    time: '60+ min/day',
    description: 'Highly targeted 20-minute segments to refine specific skills.',
  },
];

export const TierCards = () => {
  return (
    <div className="not-prose my-10 grid gap-4 sm:grid-cols-3">
      {tiers.map((tier) => {
        const Icon = tier.icon;
        return (
          <div key={tier.title} className="rounded-lg bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2.5">
              <Icon className="h-5 w-5 text-zinc-400" />
              <p className="font-bold text-white">{tier.title}</p>
            </div>
            <span className={`mt-3 inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${tier.badgeClass}`}>
              {tier.time}
            </span>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{tier.description}</p>
          </div>
        );
      })}
    </div>
  );
};
