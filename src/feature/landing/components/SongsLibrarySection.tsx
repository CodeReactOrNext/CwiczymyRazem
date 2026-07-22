"use client";

import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { BookMarked, Disc3, Filter, Sliders, Star } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <Disc3 className='h-4 w-4' />,
    label: "Thousands of songs",
    desc: "A growing community-curated library spanning every genre and difficulty level",
  },
  {
    icon: <Star className='h-4 w-4' />,
    label: "Community difficulty ratings",
    desc: "Real scores from guitarists who actually practiced the song, no guesswork",
  },
  {
    icon: <Filter className='h-4 w-4' />,
    label: "Smart filtering",
    desc: "Browse by genre, difficulty, technique type, or your current skill level",
  },
  {
    icon: <BookMarked className='h-4 w-4' />,
    label: "Want to learn list",
    desc: "Save songs to your queue and turn your wishlist into a structured practice plan",
  },
];

export const SongsLibrarySection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-32'>
      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute right-0 top-1/4 h-[700px] w-[700px] rounded-full bg-cyan-500/5 blur-[160px]' />
        <div className='absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.04] blur-[120px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.7fr] xl:gap-16'>
          {/* Left - content */}
          <div className='flex flex-col'>
            <h2 className='mb-6 font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
              Every song you want <br />
              <span className='text-zinc-400'>to learn. Ranked.</span>
            </h2>

            <p className='mb-12 max-w-md text-lg leading-relaxed text-zinc-400'>
              Browse a massive library rated by the community, not algorithms.
              Find songs that match exactly where you are right now, add them to
              your queue, and start learning with context.
            </p>

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
          </div>

          {/* Right - screenshot */}
          <AuroraGlowFrame>
            <div className='relative rounded-lg p-1.5 glass-card'>
              <div className='flex items-center gap-1.5 px-3 py-2'>
                <Sliders className='h-3 w-3 text-zinc-400' />
                <span className='rounded bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold text-cyan-400'>
                  Difficulty under 6
                </span>
              </div>

              <div className='relative overflow-hidden rounded-lg'>
                <Image
                  src='/images/feature/songs.webp'
                  alt='Song library with community difficulty ratings and genre filters'
                  width={900}
                  height={700}
                  className='h-auto w-full object-cover'
                  priority={false}
                />
                {/* Bottom fade */}
                <div className='pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-900/70 to-transparent' />
              </div>
            </div>

            {/* Floating badge */}
            <div className='absolute -bottom-4 -right-4 flex items-center gap-2 rounded-lg bg-zinc-800/70 px-4 py-2.5'>
              <span className='text-[11px] font-bold text-cyan-400'>
                Community rated
              </span>
            </div>
          </AuroraGlowFrame>
        </div>
      </div>
    </section>
  );
};
