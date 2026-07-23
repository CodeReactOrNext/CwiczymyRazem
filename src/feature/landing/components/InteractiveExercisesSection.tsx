"use client";

import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { Reveal } from "feature/landing/components/Reveal";
import { Guitar, Mic, Timer } from "lucide-react";
import Image from "next/image";

// "144 exercises" lives in ExerciseCatalogPreview (breadth); this section
// sells the depth of a single exercise: synced playback, tempo work and
// pitch-detection scoring, all in one place.
const features = [
  {
    icon: <Guitar className='h-4 w-4' />,
    label: "Guitar Pro files",
    desc: "Import any GP file, tablature stays synced to audio",
  },
  {
    icon: <Timer className='h-4 w-4' />,
    label: "Tempo control",
    desc: "Slow any exercise down until it's clean, then speed up",
  },
  {
    icon: <Mic className='h-4 w-4' />,
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
          <h2 className='mb-6 font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
            Practice with tabs. <br />
            <span className='text-zinc-400'>Hear every note.</span>
          </h2>
          <p className='max-w-xl text-lg leading-relaxed text-zinc-400'>
            Animated GP tablature, synced to real audio playback. Turn on pitch
            detection and it&apos;s Guitar Hero, on a real guitar: every note
            you hit lights up as you play.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <AuroraGlowFrame>
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
          </AuroraGlowFrame>
        </Reveal>

        <Reveal
          delay={0.15}
          className='mt-12 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-3'>
          {features.map((f) => (
            <div key={f.label} className='flex items-start gap-4'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
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
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
};
