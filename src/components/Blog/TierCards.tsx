import { Flame, Sprout, Trophy } from 'lucide-react';
import React from 'react';

interface Tier {
  icon: React.ElementType;
  badgeClass: string;
  title: string;
  time: string;
  description: string;
}

/**
 * Cards are keyed to what the player is currently working on, not to months
 * since they started — time owning a guitar says nothing about what the hands
 * can do, and the 2026-09 SEO review flagged the old month ranges for exactly
 * that. `time` stays an adjustable starting example, never a minimum.
 */
const tiers: Tier[] = [
  {
    icon: Sprout,
    badgeClass: 'bg-emerald-500/10 text-emerald-300',
    title: 'Building the basics',
    time: 'from 15–30 min/day',
    description:
      'Clean fretted notes, chord changes that don’t stop, strumming in time. Most days of the week.',
  },
  {
    icon: Flame,
    badgeClass: 'bg-amber-500/10 text-amber-300',
    title: 'Working on obstacles',
    time: 'from 45–90 min/day',
    description:
      'Barre chords, scales you can play but not use, songs that fall apart at tempo. Split into ~20-minute blocks.',
  },
  {
    icon: Trophy,
    badgeClass: 'bg-purple-500/10 text-purple-300',
    title: 'Refining and maintaining',
    time: 'around 60 min/day',
    description:
      'Fundamentals are solid; practice is maintenance plus one named project. Three focused segments with breaks.',
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
