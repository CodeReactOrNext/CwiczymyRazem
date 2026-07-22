"use client";

import { Layers, PenLine, Shuffle, Timer } from "lucide-react";
import Image from "next/image";

export const PracticePlansSection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-32'>
      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute left-0 top-1/3 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[150px]' />
        <div className='absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.04] blur-[130px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-14 max-w-2xl'>
          <h2 className='mb-6 font-landingHeading text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl'>
            Your practice, <br />
            <span className='text-zinc-500'>your rules.</span>
          </h2>
          <p className='max-w-md text-lg leading-relaxed text-zinc-400'>
            Stop improvising your sessions. Build structured practice plans from
            scratch or pick a ready-made template, then execute with focus and
            track every minute of it.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-5 md:grid-cols-5'>
          {/* Featured tile: real screenshot */}
          <div className='flex flex-col rounded-lg p-1.5 glass-card md:col-span-3 md:row-span-2'>
            <div className='relative flex-1 overflow-hidden rounded-lg'>
              <Image
                src='/images/feature/practices-plans.webp'
                alt='Practice plans library with custom and template routines'
                width={1200}
                height={800}
                className='h-auto w-full object-cover'
                priority={false}
              />
            </div>
            <div className='flex items-start gap-4 p-5'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
                <PenLine className='h-4 w-4' />
              </div>
              <div>
                <div className='mb-0.5 text-sm font-bold text-white'>
                  Build your own plan
                </div>
                <div className='text-sm leading-relaxed text-zinc-500'>
                  Create a fully custom routine from scratch, pick exercises,
                  set durations, define order
                </div>
              </div>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg bg-zinc-900/40 p-5 md:col-span-2'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
              <Layers className='h-4 w-4' />
            </div>
            <div>
              <div className='mb-0.5 text-sm font-bold text-white'>
                Ready-made templates
              </div>
              <div className='text-sm leading-relaxed text-zinc-500'>
                Curated plans for technique, theory, creativity, and ear
                training
              </div>
            </div>
          </div>

          <div className='flex items-start gap-4 rounded-lg bg-zinc-900/40 p-5 md:col-span-2'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
              <Timer className='h-4 w-4' />
            </div>
            <div>
              <div className='mb-0.5 text-sm font-bold text-white'>
                Timed sessions
              </div>
              <div className='text-sm leading-relaxed text-zinc-500'>
                Each block has a fixed time slot so your practice stays focused
                and on schedule
              </div>
            </div>
          </div>

          <div className='flex items-center gap-5 rounded-lg bg-cyan-500/10 p-6 md:col-span-5'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400'>
              <Shuffle className='h-5 w-5' />
            </div>
            <div>
              <div className='mb-0.5 text-base font-bold text-white'>
                Auto-plan
              </div>
              <div className='text-sm leading-relaxed text-zinc-400'>
                One click generates a ready-to-go session based on your stats,
                no planning needed, just pick up and play
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
