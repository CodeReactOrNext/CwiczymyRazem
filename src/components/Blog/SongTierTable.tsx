import { getAllTiers } from 'feature/songs/utils/getSongTier';

const tierDetails: Record<string, { range: string; desc: string }> = {
  D: { range: '1 – 3.9', desc: 'Great starting point. Simple chord progressions and beginner-friendly riffs.' },
  C: { range: '4 – 5.9', desc: 'Intermediate songs requiring basic technique and consistent practice.' },
  B: { range: '6 – 7.4', desc: 'Advanced songs with complex fingering, speed, or expressive demands.' },
  A: { range: '7.5 – 8.9', desc: 'Expert-level pieces that challenge experienced guitarists significantly.' },
  S: { range: '9 – 10', desc: 'Legendary difficulty. Reserved for the most technically demanding songs.' },
};

export const SongTierTable = () => {
  const tiers = getAllTiers().filter((tier) => tier.tier !== '?');

  return (
    <div className="not-prose my-10 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/40">
      <div className="divide-y divide-white/5">
        {tiers.map((tier) => {
          const detail = tierDetails[tier.tier] ?? { range: '', desc: '' };
          return (
            <div key={tier.tier} className="flex items-center gap-4 p-5">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl font-black"
                style={{ backgroundColor: `${tier.color}15`, color: tier.color }}
              >
                {tier.tier}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-bold text-white">{tier.label}</span>
                  <span className="text-xs font-medium text-zinc-500">{detail.range}</span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-zinc-400">{detail.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
