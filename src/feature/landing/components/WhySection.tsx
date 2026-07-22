"use client";

import { Brain, Music2, TrendingUp } from "lucide-react";

const leadReason = {
  title: "Focus on what matters",
  description:
    "Don't waste time on generic exercises. Tracker helps you focus on the techniques that actually improve your playing, based on where you actually are.",
  icon: <Brain className='h-8 w-8 text-cyan-400' />,
  iconBg: "bg-cyan-500/10",
};

const reasons = [
  {
    title: "Track your progress",
    description:
      "See your improvement over time with detailed practice logs and frequency charts. Motivation comes from seeing results.",
    icon: <TrendingUp className='h-6 w-6 text-cyan-500' />,
    iconBg: "bg-cyan-500/10",
  },
  {
    title: "Build consistent habits",
    description:
      "The secret to guitar mastery is consistency. Our tools are designed to keep you picking up your guitar every single day.",
    icon: <Music2 className='h-6 w-6 text-cyan-300' />,
    iconBg: "bg-cyan-500/10",
  },
];

export const WhySection = () => {
  return (
    <section className='relative overflow-hidden bg-zinc-950 py-32'>
      {/* Subtle background glow */}
      <div className='pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.15] blur-[140px]'></div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-20 max-w-3xl'>
          <h2 className='font-landingHeading text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl'>
            Built for those who <br />
            <span className='text-cyan-400'>refuse to plateau.</span>
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          <div className='flex flex-col justify-between rounded-lg bg-zinc-900/40 p-8 lg:p-10'>
            <div
              className={`h-16 w-16 rounded-lg ${leadReason.iconBg} mb-10 flex items-center justify-center`}>
              {leadReason.icon}
            </div>
            <div>
              <h3 className='mb-4 text-3xl font-bold tracking-tight text-white'>
                {leadReason.title}
              </h3>
              <p className='max-w-md text-lg leading-relaxed text-zinc-400'>
                {leadReason.description}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-8'>
            {reasons.map((reason, index) => (
              <div
                key={index}
                className='flex items-start gap-5 rounded-lg bg-zinc-900/40 p-8'>
                <div
                  className={`h-11 w-11 rounded-lg ${reason.iconBg} flex shrink-0 items-center justify-center`}>
                  {reason.icon}
                </div>
                <div>
                  <h3 className='mb-2 text-xl font-bold tracking-tight text-white'>
                    {reason.title}
                  </h3>
                  <p className='leading-relaxed text-zinc-400'>
                    {reason.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
