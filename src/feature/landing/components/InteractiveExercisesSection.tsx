"use client";

import { FeatureList } from "feature/landing/components/FeatureList";
import { Reveal } from "feature/landing/components/Reveal";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// "144 exercises" lives in ExerciseCatalogPreview (breadth); this section
// sells the depth of a single exercise: synced playback, tempo work and
// pitch-detection scoring, all in one place. The rows are numbered because
// that is the order a session actually happens in: load, slow down, score.
const features = [
  {
    label: "Guitar Pro files",
    desc: "Import any GP file, tablature stays synced to audio",
  },
  {
    label: "Tempo control",
    desc: "Slow any exercise down until it's clean, then speed up",
  },
  {
    label: "Live score and accuracy",
    desc: "Each take gets a score, accuracy and a combo multiplier",
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
        <Reveal className='mb-12 max-w-2xl'>
          <h2 className='mb-6 font-landingHeading text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-5xl'>
            Practice with tabs. <br />
            <span className='text-zinc-400'>Hear every note.</span>
          </h2>
          <p className='max-w-xl text-lg leading-relaxed text-zinc-400'>
            Animated GP tablature, synced to real audio playback. Turn on pitch
            detection and it&apos;s Guitar Hero, on a real guitar: every note
            you hit lights up as you play.
          </p>
          <Link
            href='/interactive-guitar-practice'
            className='mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
            See a session with note feedback, step by step
            <ArrowRight className='h-4 w-4' aria-hidden='true' />
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <div className='relative rounded-lg p-1.5 glass-card'>
            <div className='relative overflow-hidden rounded-lg'>
              {/* The full 2336px-wide strip collapses into an unreadable
                  sliver on phones, so mobile gets a taller crop of the same
                  screenshot (playhead + detected notes + Pitch Detect). */}
              <Image
                src='/images/tabs-live.webp'
                alt='Tablature lighting up in real time as pitch detection recognizes the notes being played'
                width={2336}
                height={625}
                className='hidden h-auto w-full sm:block'
                priority={false}
              />
              <Image
                src='/images/tabs-live-mobile.webp'
                alt='Tablature lighting up in real time as pitch detection recognizes the notes being played'
                width={972}
                height={625}
                className='h-auto w-full sm:hidden'
                priority={false}
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15} className='mt-14'>
          <FeatureList features={features} layout='row' />
        </Reveal>
      </div>
    </section>
  );
};
