"use client";

import { Brain, Music2, TrendingUp } from "lucide-react";

const reasons = [
  {
    title: "Focus on what matters",
    description: "Don't waste time on generic exercises. Tracker helps you focus on the techniques that actually improve your playing.",
    icon: <Brain className="w-7 h-7 text-cyan-400 drop-shadow-md" />,
    iconBg: "bg-gradient-to-br from-cyan-500/20 to-cyan-500/5",
    iconBorder: "border border-white/5 border-t-cyan-500/40 border-l-cyan-500/20",
  },
  {
    title: "Track your progress",
    description: "See your improvement over time with detailed practice logs and frequency charts. Motivation comes from seeing results.",
    icon: <TrendingUp className="w-7 h-7 text-emerald-400 drop-shadow-md" />,
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5",
    iconBorder: "border border-white/5 border-t-emerald-500/40 border-l-emerald-500/20",
  },
  {
    title: "Build consistent habits",
    description: "The secret to guitar mastery is consistency. Our tools are designed to keep you picking up your guitar every single day.",
    icon: <Music2 className="w-7 h-7 text-violet-400 drop-shadow-md" />,
    iconBg: "bg-gradient-to-br from-violet-500/20 to-violet-500/5",
    iconBorder: "border border-white/5 border-t-violet-500/40 border-l-violet-500/20",
  },
];

export const WhySection = () => {


  return (
    <section className="py-32 bg-zinc-950 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/[0.15] blur-[140px] rounded-full pointer-events-none"></div>

      <div className='mx-auto max-w-7xl px-6 lg:px-8 relative z-10'>
        <div className='max-w-3xl mb-24'>
          <h2 className='text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-tight font-display'>
            Built for those who <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">refuse to plateau.</span>
          </h2>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-16'>
          {reasons.map((reason, index) => (
            <div
              key={index}
              className='group flex flex-col'
            >
              <div className={`w-14 h-14 rounded-lg ${reason.iconBg} ${reason.iconBorder} flex items-center justify-center mb-8 shadow-lg transition-all duration-300 group-hover:scale-105`}>
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
