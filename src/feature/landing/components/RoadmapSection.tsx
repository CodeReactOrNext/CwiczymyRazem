"use client";

import { cn } from "assets/lib/utils";
import { ArrowRight, Play, Target } from "lucide-react";

const GOAL_TAGS = [
  "Shred Speed",
  "Fingerpicking",
  "Music Theory",
  "Improvisation",
  "Sweep Picking",
];

const ROADMAP_STEPS = [
  {
    level: "Week 1-2",
    title: "Chromatic warm-up",
    type: "Technique",
    color: "bright",
    done: true,
  },
  {
    level: "Week 3-4",
    title: "Spider exercise positions",
    type: "Technique",
    color: "bright",
    done: true,
  },
  {
    level: "Week 5-6",
    title: "Pentatonic patterns",
    type: "Creativity",
    color: "muted",
    done: false,
    active: true,
  },
  {
    level: "Week 7-8",
    title: "String skipping drill",
    type: "Technique",
    color: "bright",
    done: false,
  },
  {
    level: "Week 9+",
    title: "Full solo integration",
    type: "Creativity",
    color: "muted",
    done: false,
  },
];

// One accent hue (cyan), two categories differentiated by brightness rather
// than a second color: "Technique" reads brighter/primary, "Creativity"
// reads deeper/muted.
const colorMap: Record<string, string> = {
  bright: "bg-cyan-500/10 text-cyan-400",
  muted: "bg-cyan-900/40 text-cyan-300",
};

export const RoadmapSection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-32'>
      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[160px]' />
        <div className='absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.04] blur-[130px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-start gap-16 lg:grid-cols-2 xl:gap-24'>
          {/* Left - content */}
          <div className='flex flex-col lg:sticky lg:top-24'>
            <span className='mb-6 text-sm font-bold tracking-wide text-cyan-400'>
              Mastery roadmaps
            </span>

            <h2 className='mb-6 font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
              Pick your goal. <br />
              <span className='text-zinc-400'>We map the path.</span>
            </h2>

            <p className='mb-8 max-w-md text-lg leading-relaxed text-zinc-400'>
              Tell the app what you want to achieve. It builds a week-by-week
              mastery roadmap with the right drills in the right order, each one
              linked to a curated YouTube lesson so you know exactly how to
              execute it.
            </p>

            {/* Goal selector mock */}
            <div className='mb-10'>
              <div className='mb-3 text-[10px] font-bold text-zinc-400'>
                Your goal
              </div>
              <div className='flex flex-wrap gap-2'>
                {GOAL_TAGS.map((tag, i) => (
                  <div
                    key={tag}
                    className={cn(
                      "cursor-default rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors",
                      i === 0
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "bg-zinc-900/60 text-zinc-400",
                    )}>
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - roadmap visual */}
          <div className='relative flex flex-col gap-3'>
            {ROADMAP_STEPS.map((step, i) => (
              <div key={i} className='relative flex gap-4'>
                {/* Timeline line */}
                {i < ROADMAP_STEPS.length - 1 && (
                  <div className='absolute left-[15px] top-[32px] h-[calc(100%+12px)] w-[2px] bg-gradient-to-b from-zinc-700/40 to-transparent' />
                )}

                {/* Dot */}
                <div
                  className={cn(
                    "relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    step.done
                      ? "border-cyan-700/50 bg-cyan-900/40"
                      : step.active
                        ? "border-cyan-500/60 bg-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                        : "border-zinc-700/50 bg-zinc-900",
                  )}>
                  {step.done ? (
                    <svg
                      className='h-3.5 w-3.5 text-cyan-300'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      strokeWidth={3}>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  ) : step.active ? (
                    <Play className='h-3 w-3 fill-cyan-400 text-cyan-400' />
                  ) : (
                    <div className='h-2 w-2 rounded-full bg-zinc-700' />
                  )}
                </div>

                {/* Card */}
                <div
                  className={cn(
                    "flex-1 rounded-lg p-4 transition-all",
                    step.active
                      ? "bg-cyan-500/5"
                      : step.done
                        ? "bg-zinc-900/30 opacity-60"
                        : "bg-zinc-900/60",
                  )}>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0 flex-1'>
                      <div className='mb-1 text-[10px] font-bold text-zinc-400'>
                        {step.level}
                      </div>
                      <div
                        className={cn(
                          "text-sm font-bold tracking-tight",
                          step.active
                            ? "text-white"
                            : step.done
                              ? "text-zinc-400"
                              : "text-zinc-300",
                        )}>
                        {step.title}
                      </div>
                    </div>
                    <div className='flex shrink-0 items-center gap-2'>
                      <span
                        className={cn(
                          "rounded px-2 py-1 text-[10px] font-bold",
                          colorMap[step.color],
                        )}>
                        {step.type}
                      </span>
                    </div>
                  </div>
                  {step.active && (
                    <div className='mt-3 flex items-center gap-1.5 text-[10px] font-bold text-cyan-400'>
                      <span>Continue</span>
                      <ArrowRight className='h-3 w-3' />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Bottom unlock hint */}
            <div className='ml-12 mt-2 flex items-center gap-2 text-[10px] font-bold text-zinc-400'>
              <Target className='h-3.5 w-3.5' />
              <span>Complete each stage to unlock the next</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
