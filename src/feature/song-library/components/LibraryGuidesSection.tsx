"use client";

import { songGuides } from "feature/song-library/song-guides/content";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { ArrowRight, Music } from "lucide-react";
import Link from "next/link";

interface LibraryGuidesSectionProps {
  guideCovers: Record<string, string | null>;
}

export const LibraryGuidesSection = ({
  guideCovers,
}: LibraryGuidesSectionProps) => {
  return (
    <section className='bg-zinc-950 py-20'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-12 max-w-xl'>
          <h2 className='font-display text-3xl font-bold leading-tight tracking-tighter text-white'>
            Deep-dive song guides.
          </h2>
          <p className='mt-3 leading-relaxed text-zinc-400'>
            Full difficulty breakdowns of the songs every guitarist eventually
            faces — which parts are hard, how long they take, and what to play
            before and after.
          </p>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {songGuides.map((guide) => {
            const tier = getSongTier(guide.editorial.difficulty);
            const coverUrl = guide.songId ? guideCovers[guide.songId] : null;

            return (
              <Link
                key={guide.slug}
                href={`/song-library/${guide.slug}`}
                className='group flex h-full flex-col rounded-lg bg-zinc-900/40 p-6 transition-background hover:bg-zinc-900/70'>
                <div className='mb-3 flex items-center gap-3'>
                  <div className='relative shrink-0'>
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl}
                        alt=''
                        className='h-14 w-14 rounded-lg object-cover'
                      />
                    ) : (
                      <div className='flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-800/60'>
                        <Music className='h-6 w-6 text-zinc-600' />
                      </div>
                    )}
                    <div
                      className='absolute -bottom-1 -right-1 rounded-md border px-1 py-0.5 text-[10px] font-black backdrop-blur-xl'
                      style={{
                        borderColor: `${tier.color}40`,
                        backgroundColor: "rgba(10, 10, 10, 0.9)",
                        color: tier.color,
                      }}>
                      {tier.tier}
                    </div>
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h3 translate='no' className='truncate font-bold text-zinc-100'>
                      {guide.title}
                    </h3>
                    <p translate='no' className='truncate text-sm text-zinc-500'>
                      {guide.artist}
                    </p>
                    <span
                      className='text-xs font-bold'
                      style={{ color: tier.color }}>
                      {guide.editorial.difficulty.toFixed(1)} / 10
                    </span>
                  </div>
                </div>
                <p className='mb-4 flex-1 text-sm leading-relaxed text-zinc-400'>
                  {guide.editorial.oneLiner}
                </p>
                <span className='flex items-center gap-1.5 text-sm font-medium text-cyan-400 transition-colors group-hover:text-cyan-300'>
                  Read the guide
                  <ArrowRight className='h-4 w-4' />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
