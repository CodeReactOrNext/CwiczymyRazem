"use client";

import { songGuides } from "feature/song-library/song-guides/content";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

export const LibraryGuidesSection = () => {
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

            return (
              <Link
                key={guide.slug}
                href={`/song-library/${guide.slug}`}
                className='group flex h-full flex-col rounded-lg bg-zinc-900/40 p-6 transition-background hover:bg-zinc-900/70'>
                <div className='mb-3 flex items-center justify-between gap-3'>
                  <BookOpen className='h-4 w-4 text-zinc-400' />
                  <span
                    className='text-sm font-bold'
                    style={{ color: tier.color }}>
                    {guide.editorial.difficulty.toFixed(1)} · {tier.label}
                  </span>
                </div>
                <h3 translate='no' className='font-bold text-zinc-100'>
                  {guide.title}
                </h3>
                <p translate='no' className='mb-3 text-sm text-zinc-500'>
                  {guide.artist}
                </p>
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
