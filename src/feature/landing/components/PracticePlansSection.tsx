"use client";

import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { FeatureList } from "feature/landing/components/FeatureList";
import { Reveal } from "feature/landing/components/Reveal";
import Image from "next/image";

const features = [
  {
    label: "Build your own plan",
    desc: "Pick exercises, set durations, define the order",
  },
  {
    label: "Ready-made templates",
    desc: "Curated for technique, theory, creativity, ear training",
  },
  {
    label: "Timed sessions",
    desc: "Each block gets a fixed slot, so practice stays on schedule",
  },
  {
    label: "Auto-plan",
    desc: "One click generates a session from your stats, no planning",
  },
];

export const PracticePlansSection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-24'>
      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute left-0 top-1/3 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[150px]' />
        <div className='absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.04] blur-[130px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.7fr_1fr] xl:gap-16'>
          {/* Left - screenshot */}
          <div className='order-2 lg:order-1'>
            <Reveal>
              <AuroraGlowFrame>
                <div className='relative rounded-lg p-1.5 glass-card'>
                  <div className='relative overflow-hidden rounded-lg'>
                    <Image
                      src='/images/plans-library.webp'
                      alt='Practice plans library with ready-made training programs'
                      width={1401}
                      height={704}
                      className='h-auto w-full'
                      priority={false}
                    />
                  </div>
                </div>
              </AuroraGlowFrame>
            </Reveal>
          </div>

          {/* Right - content */}
          <Reveal delay={0.1} className='order-1 flex flex-col lg:order-2'>
            <h2 className='mb-6 font-landingHeading text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-5xl'>
              Your practice, your rules.
            </h2>
            <p className='mb-10 max-w-md text-lg leading-relaxed text-zinc-400'>
              Stop improvising. Build a structured plan from scratch or pick a
              template, then execute with focus.
            </p>

            <FeatureList features={features} />
          </Reveal>
        </div>
      </div>
    </section>
  );
};
