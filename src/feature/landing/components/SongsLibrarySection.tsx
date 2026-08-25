"use client";

import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { Reveal } from "feature/landing/components/Reveal";
import { featuredGuides } from "feature/landing/data/featuredGuides";
import type { PathSongLiveDataMap } from "feature/song-library/song-guides/types";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { ArrowRight, BookMarked, Disc3, Filter, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface SongsLibrarySectionProps {
  guideLiveData?: PathSongLiveDataMap;
}

const features = [
  {
    icon: <Disc3 className='h-4 w-4' />,
    label: "Thousands of songs",
    desc: "A growing library spanning every genre and level",
  },
  {
    icon: <Star className='h-4 w-4' />,
    label: "Community difficulty ratings",
    desc: "Real scores from guitarists who played the song",
  },
  {
    icon: <Filter className='h-4 w-4' />,
    label: "Smart filtering",
    desc: "By genre, difficulty, technique, or skill level",
  },
  {
    icon: <BookMarked className='h-4 w-4' />,
    label: "Want to learn list",
    desc: "Turn your wishlist into a structured plan",
  },
];

export const SongsLibrarySection = ({
  guideLiveData = {},
}: SongsLibrarySectionProps) => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-24'>
      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute right-0 top-1/4 h-[700px] w-[700px] rounded-full bg-cyan-500/5 blur-[160px]' />
        <div className='absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.04] blur-[120px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.7fr] xl:gap-16'>
          {/* Left - content */}
          <Reveal className='flex flex-col'>
            <h2 className='mb-6 font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
              Every song you want{" "}
              <span className='text-zinc-400'>to learn. Ranked.</span>
            </h2>

            <p className='mb-6 max-w-md text-lg leading-relaxed text-zinc-400'>
              Rated by the community, not algorithms. Find songs that match your
              level and start learning with context.
            </p>

            <Link
              href='/song-library'
              className='mb-8 inline-flex items-center gap-1 text-sm font-semibold text-cyan-400 transition-colors hover:text-cyan-300'>
              Browse the song library
              <ArrowRight className='h-3.5 w-3.5' />
            </Link>

            {/* Feature list */}
            <ul className='space-y-5'>
              {features.map((f, i) => (
                <li key={i} className='flex items-start gap-4'>
                  <div className='mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
                    {f.icon}
                  </div>
                  <div>
                    <div className='mb-0.5 text-sm font-bold text-white'>
                      {f.label}
                    </div>
                    <div className='text-sm leading-relaxed text-zinc-400'>
                      {f.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Featured song guides */}
            <div className='mt-8'>
              <p className='mb-2.5 text-sm font-bold text-white'>
                Popular guides
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {featuredGuides.map((guide) => {
                  const live = guide.songId
                    ? guideLiveData[guide.songId]
                    : undefined;
                  const liveRating =
                    live && live.avgDifficulty > 0 ? live : undefined;
                  const tier = getSongTier(
                    liveRating?.tier ?? guide.editorial.difficulty
                  );
                  return (
                    <Link
                      key={guide.slug}
                      href={`/song-library/${guide.slug}`}
                      className='group inline-flex items-center gap-1.5 rounded-md bg-zinc-900/40 px-2.5 py-1 text-xs transition-colors hover:bg-zinc-900/70'>
                      <span
                        translate='no'
                        className='font-semibold text-zinc-300 transition-colors group-hover:text-white'>
                        {guide.title}
                      </span>
                      <span
                        className='text-[11px] font-bold'
                        style={{ color: tier.color }}>
                        {tier.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Right - screenshot */}
          <Reveal delay={0.1}>
            <AuroraGlowFrame>
              <div className='relative rounded-lg p-1.5 glass-card'>
                <div className='relative overflow-hidden rounded-lg'>
                  <Image
                    src='/images/songs-library.webp'
                    alt='Song library with community difficulty ratings and genre filters'
                    width={1122}
                    height={1125}
                    className='h-auto w-full object-cover'
                    priority={false}
                  />
                  {/* Bottom fade */}
                  <div className='pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-900/70 to-transparent' />
                </div>
              </div>
            </AuroraGlowFrame>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
