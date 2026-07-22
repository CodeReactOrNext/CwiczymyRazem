"use client";

import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
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
    // The one light section on the landing page (see PR writeup for why and
    // for the WCAG contrast table). Hard edge on purpose: no gradient fade
    // into the dark sections above/below it, so the tone shift itself reads
    // as an intentional pause, not a glitch.
    <section className='relative overflow-hidden bg-ivory py-32'>
      <GuitarPatternBackground variant='light' opacity={0.035} />

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-16 max-w-3xl'>
          <h2 className='font-landingHeading text-4xl font-semibold leading-tight tracking-tight text-ivory-fg sm:text-5xl'>
            Loved by guitarists <br />
            who show up.
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]'>
          <div className='flex flex-col justify-between rounded-lg bg-ivory-surface p-10'>
            <Quote className='mb-6 h-9 w-9 shrink-0 text-ivory-accent' />
            <p className='flex-1 text-xl leading-relaxed text-ivory-fg'>
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
                <div className='text-sm font-bold text-ivory-fg'>
                  {featured.name}
                </div>
                <div className='text-xs text-ivory-muted'>
                  RiffQuest community
                </div>
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-6'>
            {rest.map((testimonial) => (
              <div
                key={testimonial.name}
                className='flex flex-1 flex-col rounded-lg bg-ivory-surface p-6'>
                <p className='flex-1 text-sm leading-relaxed text-ivory-fg'>
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
                    <div className='text-sm font-bold text-ivory-fg'>
                      {testimonial.name}
                    </div>
                    <div className='text-xs text-ivory-muted'>
                      RiffQuest community
                    </div>
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
