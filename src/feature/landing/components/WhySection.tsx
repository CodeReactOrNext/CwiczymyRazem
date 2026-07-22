"use client";

import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { Brain, Music2, TrendingUp } from "lucide-react";

const reasons = [
  {
    title: "Focus on what matters",
    description:
      "No generic exercises, just techniques that move your playing forward.",
    icon: <Brain className='h-5 w-5 text-cyan-400' />,
  },
  {
    title: "Track your progress",
    description: "Detailed logs and charts so results are impossible to miss.",
    icon: <TrendingUp className='h-5 w-5 text-cyan-400' />,
  },
  {
    title: "Build consistent habits",
    description: "Consistency beats talent. We keep you picking up the guitar.",
    icon: <Music2 className='h-5 w-5 text-cyan-400' />,
  },
];

// Collapsed from a two-tier bento layout into a single slim strip: this
// section restates the value prop between two much more visual sections
// (Hero and Interactive Exercises), so it earns its place as a quick beat,
// not a full-height feature block competing for the same attention.
export const WhySection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-14'>
      <div className='pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.1] blur-[140px]'></div>
      <GuitarPatternBackground opacity={0.02} />

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <h2 className='mb-8 font-landingHeading text-2xl font-bold tracking-tight text-white sm:text-3xl'>
          Built for those who{" "}
          <span className='text-cyan-400'>refuse to plateau.</span>
        </h2>

        <div className='grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3'>
          {reasons.map((reason, index) => (
            <div key={index} className='flex items-start gap-3'>
              <div className='mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10'>
                {reason.icon}
              </div>
              <div>
                <h3 className='mb-1 text-sm font-bold tracking-tight text-white'>
                  {reason.title}
                </h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
