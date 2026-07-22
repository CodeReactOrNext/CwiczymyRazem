"use client";

import { Brain, Music2, TrendingUp } from "lucide-react";

const leadReason = {
  title: "Focus on what matters",
  description:
    "Don't waste time on generic exercises. Tracker helps you focus on the techniques that actually improve your playing, based on where you actually are.",
  icon: <Brain className="w-8 h-8 text-cyan-400" />,
  iconBg: "bg-cyan-500/10",
};

const reasons = [
  {
    title: "Track your progress",
    description: "See your improvement over time with detailed practice logs and frequency charts. Motivation comes from seeing results.",
    icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
    iconBg: "bg-emerald-500/10",
  },
  {
    title: "Build consistent habits",
    description: "The secret to guitar mastery is consistency. Our tools are designed to keep you picking up your guitar every single day.",
    icon: <Music2 className="w-6 h-6 text-violet-400" />,
    iconBg: "bg-violet-500/10",
  },
];

export const WhySection = () => {
  return (
    <section className="py-32 bg-zinc-950 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/[0.15] blur-[140px] rounded-full pointer-events-none"></div>

      <div className='mx-auto max-w-7xl px-6 lg:px-8 relative z-10'>
        <div className='max-w-3xl mb-20'>
          <h2 className='text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display'>
            Built for those who <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">refuse to plateau.</span>
          </h2>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          <div className='rounded-lg bg-zinc-900/40 p-8 lg:p-10 flex flex-col justify-between'>
            <div className={`w-16 h-16 rounded-lg ${leadReason.iconBg} flex items-center justify-center mb-10`}>
              {leadReason.icon}
            </div>
            <div>
              <h3 className='text-3xl font-bold text-white tracking-tight mb-4'>
                {leadReason.title}
              </h3>
              <p className='text-zinc-400 text-lg leading-relaxed max-w-md'>
                {leadReason.description}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-8'>
            {reasons.map((reason, index) => (
              <div key={index} className='rounded-lg bg-zinc-900/40 p-8 flex items-start gap-5'>
                <div className={`w-11 h-11 rounded-lg ${reason.iconBg} flex items-center justify-center shrink-0`}>
                  {reason.icon}
                </div>
                <div>
                  <h3 className='text-xl font-bold text-white tracking-tight mb-2'>
                    {reason.title}
                  </h3>
                  <p className='text-zinc-400 leading-relaxed'>
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
