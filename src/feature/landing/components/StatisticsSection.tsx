"use client";

import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { Reveal } from "feature/landing/components/Reveal";
import { BarChart2, Clock, Star, TrendingUp } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <Clock className='h-4 w-4' />,
    label: "Total practice time",
    desc: "Every session logged, down to the hour",
  },
  {
    icon: <BarChart2 className='h-4 w-4' />,
    label: "Skill breakdown",
    desc: "Technique, Theory, Creativity, Hearing",
  },
  {
    icon: <Star className='h-4 w-4' />,
    label: "Points & milestones",
    desc: "Earn XP and climb the leaderboard",
  },
  {
    icon: <TrendingUp className='h-4 w-4' />,
    label: "Long-term trends",
    desc: "Spot plateaus and breakthroughs over time",
  },
];

export const StatisticsSection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-900 py-24'>
      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute left-0 top-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[150px]' />
        <div className='absolute bottom-0 right-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.04] blur-[130px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.7fr_1fr] xl:gap-16'>
          {/* Left - screenshot */}
          <div className='order-2 flex flex-col lg:order-1'>
            <Reveal>
              <AuroraGlowFrame>
                <div className='relative rounded-lg p-1.5 glass-card'>
                  <div className='relative overflow-hidden rounded-lg'>
                    <Image
                      src='/images/stats-overview.webp'
                      alt='Practice statistics with total time, points, skill split and all-time activity chart'
                      width={1412}
                      height={804}
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
            <span className='mb-6 text-sm font-bold tracking-wide text-cyan-400'>
              Progress tracking
            </span>

            <h2 className='mb-6 font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
              Where your hours actually go.
            </h2>

            <p className='mb-8 max-w-md text-lg leading-relaxed text-zinc-400'>
              Every session is logged and broken down automatically, so you can
              see what you practiced and what you skipped.
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
          </Reveal>
        </div>
      </div>
    </section>
  );
};
