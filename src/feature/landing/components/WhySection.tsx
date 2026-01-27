"use client";

import { Brain, Music2, TrendingUp } from "lucide-react";

const reasons = [
  {
    title: "Focus on what matters",
    description: "Don't waste time on generic exercises. Tracker helps you focus on the techniques that actually improve your playing.",
    icon: <Brain className="w-6 h-6 text-cyan-400" />,
  },
  {
    title: "Track your progress",
    description: "See your improvement over time with detailed practice logs and frequency charts. Motivation comes from seeing results.",
    icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
  },
  {
    title: "Build consistent habits",
    description: "The secret to guitar mastery is consistency. Our tools are designed to keep you picking up your guitar every single day.",
    icon: <Music2 className="w-6 h-6 text-purple-400" />,
  },
];

export const WhySection = () => {
  const grainOverlay = "before:content-[''] before:absolute before:inset-0 before:opacity-[0.03] before:pointer-events-none before:bg-[url('/static/images/old_effect_dark.webp')] before:z-50";

  return (
    <section className={`py-32 bg-zinc-950 relative overflow-hidden ${grainOverlay}`}>
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className='mx-auto max-w-7xl px-6 lg:px-8 relative z-10'>
        <div className='max-w-3xl mb-24'>
          <h2 className='text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display'>
            Built for those who <br />
            <span className="text-zinc-600">refuse to plateau.</span>
          </h2>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-16'>
          {reasons.map((reason, index) => (
            <div 
              key={index} 
              className='flex flex-col'
            >
              <div className='w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-8 shadow-xl relative group'>
                 <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                 {reason.icon}
              </div>
              <h3 className='text-2xl font-bold text-white tracking-tight mb-4'>
                {reason.title}
              </h3>
              <p className='text-zinc-400 text-lg leading-relaxed'>
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
