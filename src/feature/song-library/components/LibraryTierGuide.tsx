"use client";

import { getAllTiers } from "feature/songs/utils/getSongTier";

const tierDetails: Record<string, { range: string; desc: string }> = {
  D: { range: "1 – 3.9", desc: "Great starting point. Simple chord progressions and beginner-friendly riffs." },
  C: { range: "4 – 5.9", desc: "Intermediate songs requiring basic technique and consistent practice." },
  B: { range: "6 – 7.4", desc: "Advanced songs with complex fingering, speed, or expressive demands." },
  A: { range: "7.5 – 8.9", desc: "Expert-level pieces that challenge experienced guitarists significantly." },
  S: { range: "9 – 10", desc: "Legendary difficulty. Reserved for the most technically demanding songs." },
  "?": { range: "Unrated", desc: "Not yet rated by the community. Be the first to try it." },
};

export const LibraryTierGuide = () => {
  const tiers = getAllTiers();

  return (
    <section className="relative py-24 bg-zinc-950 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-xl mb-12">
          <h2 className="text-3xl font-bold text-white tracking-tighter leading-tight font-display">
            Understanding Guitar Song{" "}
            <span className="text-zinc-500">Difficulty Tiers</span>
          </h2>
          <p className="mt-4 text-zinc-400 text-sm leading-relaxed">
            Every song in our library is rated 1–10 by guitarists who actually practiced it.
            We group these into 5 tiers — so you always know what you&apos;re getting into.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {tiers.map((tier) => {
            const detail = tierDetails[tier.tier] ?? { range: "", desc: "" };
            return (
              <div
                key={tier.tier}
                className="flex flex-col rounded-xl border p-4 transition-colors"
                style={{
                  borderColor: `${tier.color}25`,
                  backgroundColor: `${tier.color}08`,
                }}
              >
                <div
                  className="text-4xl font-black mb-3 font-display"
                  style={{ color: tier.color }}
                >
                  {tier.tier}
                </div>
                <div className="text-xs font-bold text-white mb-1">{tier.label}</div>
                <div className="text-[10px] font-bold text-zinc-600 mb-2">
                  {detail.range}
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{detail.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
