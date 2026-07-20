"use client";

import { Quote } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    name: "Apoth",
    avatar: "/images/testimonials/apoth.jpg",
    quote:
      "I love this app. Before I struggled with keeping myself motivated to play guitar. I tried other forms of tracking to try and see if they help, but in the end I always stopped as it was too difficult to motivate myself to do it. RiffQuest not only tracks my progress, it also motivates me to pick up my guitar through gamification mechanics. Now I play more regularly and the diversity of my practice increased too.",
  },
  {
    name: "Cookie",
    avatar: "/images/testimonials/cookie.jpg",
    quote:
      "I've been playing for more years than I am prepared to admit. I've tried a lot of practice tools, but this one really stands out. It has well-designed exercises that listen to your playing, track your progress, and provide outstanding practice logging to help you grow. The gamified extras keep things fun and motivating, and the community makes it feel like you're all improving together.",
  },
  {
    name: "StayAtHomeGuitarist",
    avatar: "/images/testimonials/stayathome.jpg",
    quote:
      "RiffQuest has completely changed practicing for me. Instead of remembering to update a spreadsheet with my playing hours, I can now see at a glance exactly how much time I've spent on each category of playing and even track my progress per song. The gamification of daily tasks, leaderboards, and gear collection really scratches an itch that keeps me consistent.",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className='relative py-32 bg-zinc-950 overflow-hidden'>
      {/* Top divider */}
      <div className='absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent' />

      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-purple-500/5 blur-[150px]' />
        <div className='absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/4 blur-[130px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-20 max-w-3xl'>
          <span className='mb-6 block text-sm font-black uppercase tracking-[0.3em] text-purple-400'>
            Community
          </span>
          <h2 className='font-display text-4xl font-bold leading-tight tracking-tighter text-white sm:text-5xl'>
            Loved by guitarists <br />
            who show up.
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className='flex flex-col rounded-2xl bg-zinc-900/40 p-8'
            >
              <Quote className='mb-6 h-8 w-8 shrink-0 text-zinc-700' />

              <p className='flex-1 text-[15px] leading-relaxed text-zinc-300'>
                {testimonial.quote}
              </p>

              <div className='mt-8 flex items-center gap-3'>
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  width={44}
                  height={44}
                  className='h-11 w-11 rounded-full object-cover'
                />
                <div>
                  <div className='text-sm font-bold text-white'>{testimonial.name}</div>
                  <div className='text-xs text-zinc-500'>RiffQuest community</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
