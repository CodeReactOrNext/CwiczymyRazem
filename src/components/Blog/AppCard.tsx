import { Check, Star, X } from 'lucide-react';
import React from 'react';

// next-mdx-remote v6 strips JSX expression attributes from MDX content, so every
// prop must survive as a plain string. List props take pipe-delimited values.
interface AppCardProps {
  name: string;
  icon: string;
  badge?: string;
  /** App Store rating, e.g. "4.8". Omit for apps without a store listing. */
  rating?: string;
  ratingCount?: string;
  price: string;
  freeTier: string;
  platforms: string;
  /** Pipe-delimited list, e.g. "Fast|Accurate|Free". */
  pros: string;
  /** Pipe-delimited list. */
  cons: string;
  /** Pipe-delimited list of image paths. */
  screenshots?: string;
  screenshotAlt?: string;
}

const splitList = (value?: string): string[] =>
  (value ?? '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

export const AppCard = ({
  name,
  icon,
  badge,
  rating,
  ratingCount,
  price,
  freeTier,
  platforms,
  pros,
  cons,
  screenshots,
  screenshotAlt,
}: AppCardProps) => {
  const prosList = splitList(pros);
  const consList = splitList(cons);
  const shots = splitList(screenshots);

  return (
    <div className="not-prose my-10 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/40">
      {/* Header: icon, name, badge, rating */}
      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 p-5">
        <img
          src={icon}
          alt={`${name} logo`}
          width={56}
          height={56}
          loading="lazy"
          decoding="async"
          className="h-14 w-14 shrink-0 rounded-xl border border-white/10"
        />
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold tracking-tight text-white">{name}</div>
          {badge && (
            <span className="mt-1 inline-block rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              {badge}
            </span>
          )}
        </div>
        {rating && (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-xl font-bold text-white">{rating}</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              App Store{ratingCount ? ` · ${ratingCount} ratings` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Spec row */}
      <div className="grid grid-cols-1 divide-y divide-white/5 border-b border-white/5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          ['Price', price],
          ['Free tier', freeTier],
          ['Platforms', platforms],
        ].map(([label, value]) => (
          <div key={label} className="px-5 py-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</div>
            <div className="mt-0.5 text-sm font-medium text-zinc-200">{value}</div>
          </div>
        ))}
      </div>

      {/* Screenshots */}
      {shots.length > 0 && (
        <div className="flex gap-3 overflow-x-auto border-b border-white/5 bg-zinc-950/40 p-5">
          {shots.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={screenshotAlt ? `${screenshotAlt} (${i + 1})` : `${name} app screenshot ${i + 1}`}
              loading="lazy"
              decoding="async"
              className="h-64 w-auto shrink-0 rounded-lg border border-white/10 object-contain"
            />
          ))}
        </div>
      )}

      {/* Pros / Cons */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-3 p-5 sm:grid-cols-2">
        <ul className="space-y-2">
          {prosList.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-zinc-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              {item}
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          {consList.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-zinc-300">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
