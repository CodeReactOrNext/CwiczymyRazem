"use client";

import { Star, Quote } from "lucide-react";

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Mike K.",
      level: "Level 47",
      text: "Thanks to Practice Together my guitar playing improved significantly. The points system motivates me to practice daily!",
      initial: "MK",
      stats: { hours: 156, points: 1234 }
    },
    {
      name: "Anna S.",
      level: "Level 32",
      text: "I love the skill system - finally I know what to work on and I see my progress!",
      initial: "AS",
      stats: { hours: 89, points: 876 }
    },
    {
      name: "Tom W.",
      level: "Level 58",
      text: "The activity heatmap keeps me accountable. Seeing those green squares fill up is incredibly motivating.",
      initial: "TW",
      stats: { hours: 312, points: 2145 }
    },
  ];

  return (
    <section className='relative py-24 sm:py-32 bg-[#0d0d0c] border-t border-zinc-800/50'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mx-auto max-w-2xl text-center mb-16'>
          <h2 className='text-base font-semibold leading-7 text-cyan-500 tracking-wider uppercase'>Community</h2>
          <p className='mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl'>
            Trusted by guitarists worldwide
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {testimonials.map((t, i) => (
            <div key={i} className='group rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-6 transition-all hover:border-zinc-700'>
              <Quote className='w-8 h-8 text-cyan-500/30 mb-4' />
              
              <p className='text-zinc-300 leading-relaxed mb-6'>"{t.text}"</p>
              
              <div className='flex items-center gap-4 pt-4 border-t border-zinc-800'>
                <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-zinc-700 flex items-center justify-center font-bold text-cyan-400'>
                  {t.initial}
                </div>
                <div className='flex-1'>
                  <div className='font-semibold text-white'>{t.name}</div>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs text-cyan-400 font-mono'>{t.level}</span>
                    <span className='text-zinc-600'>•</span>
                    <span className='text-xs text-zinc-500'>{t.stats.hours}h practiced</span>
                  </div>
                </div>
                <div className='flex text-amber-400'>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className='h-4 w-4 fill-current' />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
