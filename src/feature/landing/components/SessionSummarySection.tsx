"use client";

import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { Brain, Sparkles, TrendingUp } from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: <Brain className='h-4 w-4' />,
    label: "AI session assessment",
    desc: "Every session gets a grade with a written breakdown of your strengths and blind spots",
  },
  {
    icon: <Sparkles className='h-4 w-4' />,
    label: "Personalized feedback",
    desc: "Not generic tips, feedback based on what you actually practiced that day",
  },
  {
    icon: <TrendingUp className='h-4 w-4' />,
    label: "Points & level progression",
    desc: "Earn XP for each session and watch your level climb in real time",
  },
];

export const SessionSummarySection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-900 py-32'>
      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute left-1/2 top-1/3 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[150px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-5xl px-6 text-center lg:px-8'>
        <h2 className='mb-6 font-landingHeading text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl'>
          End every session <br />
          <span className='text-zinc-400'>knowing what’s next.</span>
        </h2>

        <p className='mx-auto mb-14 max-w-xl text-lg leading-relaxed text-zinc-400'>
          After each practice, the AI grades your session, highlights your
          strengths, and tells you exactly what to focus on next time. No more
          guessing, just clear, actionable direction.
        </p>

        <AuroraGlowFrame className='mx-auto mb-16 max-w-3xl'>
          <div className='relative rounded-lg p-1.5 glass-card'>
            <div className='relative overflow-hidden rounded-lg'>
              <Image
                src='/images/feature/summary.webp'
                alt='AI-powered session summary with grade, strengths and improvement tips'
                width={1040}
                height={680}
                className='h-auto w-full object-cover'
                priority={false}
              />
            </div>
          </div>

          {/* Floating grade badge */}
          <div className='absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-zinc-800/70 px-4 py-2.5'>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20'>
              <span className='text-[13px] font-bold text-cyan-400'>A-</span>
            </div>
            <div className='text-left'>
              <div className='text-[11px] font-bold text-white'>
                Creative flow
              </div>
              <div className='text-[10px] font-medium text-zinc-400'>
                Today’s assessment
              </div>
            </div>
          </div>
        </AuroraGlowFrame>

        <div className='flex flex-col gap-10 rounded-lg bg-zinc-800/60 p-8 text-left sm:flex-row sm:gap-8'>
          {features.map((f, i) => (
            <div key={i} className='flex flex-1 items-start gap-4'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
                {f.icon}
              </div>
              <div>
                <div className='mb-1 text-sm font-bold text-white'>
                  {f.label}
                </div>
                <div className='text-sm leading-relaxed text-zinc-400'>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
