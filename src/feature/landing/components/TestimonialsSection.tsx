"use client";

import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { Reveal } from "feature/landing/components/Reveal";
import { Clock, Quote } from "lucide-react";
import Image from "next/image";

// The logged-hours count is the credibility signal of this section (real
// usage, not a purchased review), so it renders as an accent pill instead
// of muted micro-text.
const HoursBadge = ({ hours }: { hours: string }) => (
  <span className='mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-ivory-accent/10 px-2.5 py-1 text-xs font-bold text-ivory-accent'>
    <Clock className='h-3 w-3' />
    {hours}
  </span>
);

const featured = {
  name: "teruimaxx",
  avatar: "/images/testimonials/teruimaxx.jpg",
  hours: "137 hours logged",
  quote:
    "The only practice tool that's kept me playing for over half a year. No more pen and paper or clunky spreadsheets, I can build my own exercises or pull from RiffQuest's high-quality pre-made ones and drop them straight into a routine. Gamification, leaderboards, and sharing plans with others keep it fun, and the community is fantastic. Best and easiest way to steer your guitar journey.",
};

const rest = [
  {
    name: "Cookie",
    avatar: "/images/testimonials/cookie.jpg",
    hours: "106 hours logged",
    quote:
      "I've been playing for more years than I am prepared to admit, and this tool really stands out. Well-designed exercises, real progress tracking, and gamified extras that keep things fun.",
  },
  {
    name: "Apoth",
    avatar: "/images/testimonials/apoth.jpg",
    hours: "27 hours logged",
    quote:
      "I always struggled to stay motivated. RiffQuest tracks my progress and keeps me coming back through gamification. I play more regularly now.",
  },
  {
    name: "StayAtHomeGuitarist",
    avatar: "/images/testimonials/stayathome.jpg",
    hours: "25 hours logged",
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
    <section className='relative overflow-hidden bg-ivory py-24'>
      {/* Bumped up from 0.035: on the light background this pattern was
          nearly invisible at the previous opacity. */}
      <GuitarPatternBackground variant='light' opacity={0.09} />

      <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
        <Reveal className='mb-12 max-w-3xl'>
          <h2 className='font-landingHeading text-4xl font-bold leading-tight tracking-tight text-ivory-fg sm:text-5xl'>
            Loved by guitarists who show up.
          </h2>
        </Reveal>

        <Reveal
          delay={0.05}
          className='mb-6 flex flex-col gap-8 rounded-lg bg-ivory-surface p-10 lg:flex-row lg:items-center'>
          <Quote className='h-9 w-9 shrink-0 text-ivory-accent' />
          <p className='flex-1 text-xl leading-relaxed text-ivory-fg'>
            {featured.quote}
          </p>
          <div className='flex shrink-0 items-center gap-3 lg:flex-col lg:items-start lg:text-left'>
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
              <HoursBadge hours={featured.hours} />
            </div>
          </div>
        </Reveal>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
          {rest.map((testimonial, i) => (
            <Reveal
              key={testimonial.name}
              delay={0.1 + i * 0.08}
              className='flex h-full flex-col rounded-lg bg-ivory-surface p-6'>
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
                  <HoursBadge hours={testimonial.hours} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
