"use client";

import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { Guitar, ListMusic, Star } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <ListMusic className='h-4 w-4' />,
    label: "144 exercises built in",
    desc: "From finger warm-ups to advanced shred techniques",
  },
  {
    icon: <Guitar className='h-4 w-4' />,
    label: "Guitar Pro files",
    desc: "Import any GP file, tablature stays synced to audio",
  },
  {
    icon: <Star className='h-4 w-4' />,
    label: "Guitar Hero on a real guitar",
    desc: "Earn points per exercise while building a real skill",
  },
];

export const InteractiveExercisesSection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-24'>
      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute right-0 top-1/3 h-[700px] w-[700px] rounded-full bg-cyan-500/5 blur-[160px]' />
        <div className='absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.03] blur-[130px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.7fr] xl:gap-16'>
          {/* Left - content */}
          <div className='flex flex-col'>
            <h2 className='mb-6 font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
              Practice with tabs. <br />
              <span className='text-zinc-400'>Hear every note.</span>
            </h2>

            <p className='mb-8 max-w-md text-lg leading-relaxed text-zinc-400'>
              144 technical exercises with animated GP tablature, synced to
              real audio playback at any tempo.
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
              <div className='relative overflow-hidden rounded-lg'>
                <Image
                  src='/images/feature/tabs.webp'
                  alt='Interactive Guitar Pro tablature with animated playback'
                  width={1400}
                  height={350}
                  className='h-auto w-full object-cover'
                  priority={false}
                />
                <div className='pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-zinc-900/60' />
              </div>
            </div>

            {/* Floating badge */}
            <div className='absolute -bottom-4 -right-4 flex items-center gap-2 rounded-lg bg-zinc-800/70 px-4 py-2.5'>
              <span className='h-2 w-2 animate-pulse rounded-full bg-cyan-400' />
              <span className='text-[11px] font-bold text-white'>
                Live sync
              </span>
            </div>
          </AuroraGlowFrame>
        </div>
      </div>
    </section>
  );
};
