"use client";

import { Quote } from "lucide-react";
import Image from "next/image";

const featured = {
  name: "Cookie",
  avatar: "/images/testimonials/cookie.jpg",
  quote:
    "I've been playing for more years than I am prepared to admit, and this tool really stands out. Well-designed exercises, real progress tracking, and gamified extras that keep things fun.",
};

const rest = [
  {
    name: "Apoth",
    avatar: "/images/testimonials/apoth.jpg",
    quote:
      "I always struggled to stay motivated. RiffQuest tracks my progress and keeps me coming back through gamification. I play more regularly now.",
  },
  {
    name: "StayAtHomeGuitarist",
    avatar: "/images/testimonials/stayathome.jpg",
    quote:
      "No more spreadsheets. I can see at a glance how much time I've spent on each category, and the leaderboards keep me consistent.",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className='relative py-28 bg-zinc-950 overflow-hidden'>
      {/* Background ambience */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-purple-500/5 blur-[150px]' />
        <div className='absolute bottom-0 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/4 blur-[130px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-16 max-w-3xl'>
          <h2 className='font-display text-4xl font-bold leading-tight tracking-tighter text-white sm:text-5xl'>
            Loved by guitarists <br />
            who show up.
          </h2>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6'>
          <div className='flex flex-col justify-between rounded-lg bg-zinc-900/40 p-10'>
            <Quote className='mb-6 h-9 w-9 shrink-0 text-purple-400/60' />
            <p className='flex-1 text-xl leading-relaxed text-zinc-200'>
              {featured.quote}
            </p>
            <div className='mt-8 flex items-center gap-3'>
              <Image
                src={featured.avatar}
                alt={featured.name}
                width={48}
                height={48}
                className='h-12 w-12 rounded-full object-cover'
              />
              <div>
                <div className='text-sm font-bold text-white'>{featured.name}</div>
                <div className='text-xs text-zinc-500'>RiffQuest community</div>
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-6'>
            {rest.map((testimonial) => (
              <div
                key={testimonial.name}
                className='flex flex-1 flex-col rounded-lg bg-zinc-900/40 p-6'
              >
                <p className='flex-1 text-sm leading-relaxed text-zinc-300'>
                  {testimonial.quote}
                </p>
                <div className='mt-6 flex items-center gap-3'>
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={36}
                    height={36}
                    className='h-9 w-9 rounded-full object-cover'
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
      </div>
    </section>
  );
};
