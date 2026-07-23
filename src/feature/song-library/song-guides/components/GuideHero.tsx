import { getSongTier } from "feature/songs/utils/getSongTier";
import { ArrowRight, ChevronRight, Music } from "lucide-react";
import Link from "next/link";

import type { GuideLiveData, SongGuide } from "../types";

interface GuideHeroProps {
  guide: SongGuide;
  liveData: GuideLiveData;
}

export const GuideHero = ({ guide, liveData }: GuideHeroProps) => {
  const difficulty = liveData.song?.avgDifficulty || guide.editorial.difficulty;
  const tier = getSongTier(difficulty);
  const coverUrl = liveData.song?.coverUrl;

  return (
    <div className='relative overflow-hidden'>
      {/* Blurred cover as ambient backdrop — falls back to a cyan glow. */}
      <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
        {coverUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt=''
              className='h-full w-full scale-125 object-cover opacity-20 blur-3xl'
            />
            <div className='absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950' />
          </>
        ) : (
          <div className='absolute -top-48 left-1/2 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]' />
        )}
      </div>

      <header className='relative mx-auto w-full max-w-5xl px-6 pt-28 pb-4'>
        <nav
          aria-label='Breadcrumb'
          className='mb-10 flex items-center gap-2 text-xs text-zinc-500'>
          <Link href='/' className='transition-colors hover:text-zinc-300'>
            Home
          </Link>
          <ChevronRight className='h-3 w-3' />
          <Link
            href='/song-library'
            className='transition-colors hover:text-zinc-300'>
            Song Library
          </Link>
          <ChevronRight className='h-3 w-3' />
          <span className='max-w-[220px] truncate text-zinc-400'>
            {guide.title}
          </span>
        </nav>

        <div className='flex flex-col gap-10 md:flex-row md:items-start md:justify-between'>
          <div className='min-w-0'>
            <p className='mb-3 text-sm font-semibold text-cyan-400'>
              Song guide · {guide.artist}
            </p>
            <h1 className='font-display max-w-3xl text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl'>
              {guide.h1}
            </h1>
            <div className='mt-8 space-y-4'>
              {guide.intro.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className='max-w-3xl leading-relaxed text-zinc-400'>
                  {paragraph}
                </p>
              ))}
            </div>
            <div className='mt-8'>
              <Link
                href='/signup'
                className='inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300'>
                Track this song free
                <ArrowRight className='h-4 w-4' aria-hidden='true' />
              </Link>
            </div>
          </div>

          <div className='w-full shrink-0 rounded-lg bg-zinc-900/60 p-5 md:w-72'>
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={`${guide.title} cover`}
                width={512}
                height={512}
                className='mb-4 aspect-square w-full rounded-lg object-cover'
              />
            ) : (
              <div className='mb-4 flex aspect-square w-full items-center justify-center rounded-lg bg-zinc-800/60'>
                <Music aria-label='Song' className='h-12 w-12 text-zinc-500' />
              </div>
            )}
            <div className='mb-4 min-w-0'>
              <p translate='no' className='truncate font-bold text-zinc-100'>
                {guide.title}
              </p>
              <p translate='no' className='truncate text-sm text-zinc-400'>
                {guide.artist}
              </p>
            </div>
            <dl className='space-y-2.5'>
              {guide.facts.map((fact) => (
                <div
                  key={fact.label}
                  className='flex items-baseline justify-between gap-3'>
                  <dt className='shrink-0 text-xs text-zinc-500'>
                    {fact.label}
                  </dt>
                  <dd className='text-right text-xs font-medium text-zinc-300'>
                    {fact.value}
                  </dd>
                </div>
              ))}
              <div className='flex items-baseline justify-between gap-3'>
                <dt className='shrink-0 text-xs text-zinc-500'>Tier</dt>
                <dd
                  className='text-right text-xs font-bold'
                  style={{ color: tier.color }}>
                  {tier.label}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>
    </div>
  );
};
