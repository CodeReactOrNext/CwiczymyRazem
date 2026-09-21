"use client";

import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { DISCORD_INVITE_URL } from "constants/community";
import { Reveal } from "feature/landing/components/Reveal";
import { ArrowRight, Clock, Quote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// The logged-hours count is the credibility signal of this section (real
// usage, not a purchased review), so it renders as an accent pill instead
// of muted micro-text.
const HoursBadge = ({ hours }: { hours: string }) => (
  <span className='mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-ivory-accent px-2.5 py-1 text-xs font-bold text-white'>
    <Clock className='h-3 w-3' />
    {hours}
  </span>
);

const featured = {
  name: "teruimaxx",
  avatar: "/images/testimonials/teruimaxx.jpg",
  hours: "150 hours logged",
  quote:
    "The only practice tool that's kept me playing for over half a year. No more pen and paper or clunky spreadsheets, I can build my own exercises or pull from RiffQuest's high-quality pre-made ones and drop them straight into a routine. Gamification, leaderboards, and sharing plans with others keep it fun, and the community is fantastic. Best and easiest way to steer your guitar journey.",
};

const rest = [
  {
    name: "Cookie",
    avatar: "/images/testimonials/cookie.jpg",
    hours: "163 hours logged",
    quote:
      "I've been playing for more years than I am prepared to admit, and this tool really stands out. Well-designed exercises, real progress tracking, and gamified extras that keep things fun.",
  },
  {
    name: "Apoth",
    avatar: "/images/testimonials/apoth.jpg",
    hours: "52 hours logged",
    quote:
      "I always struggled to stay motivated. RiffQuest tracks my progress and keeps me coming back through gamification. I play more regularly now.",
  },
  {
    name: "StayAtHomeGuitarist",
    avatar: "/images/testimonials/stayathome.jpg",
    hours: "66 hours logged",
    quote:
      "No more spreadsheets. I can see at a glance how much time I've spent on each category, and the leaderboards keep me consistent.",
  },
];

// Nothing here is a claim a visitor has to take on faith: every line links to
// the place where it can be checked (the about page, the funding page, the
// server itself). No press logos or store ratings because there are none.
const trustFacts = [
  {
    title: "Built in the open since 2022",
    body: "One guitarist has been shipping it for four years, and every desktop release is public on GitHub.",
    link: { href: "/about", label: "Read the story", external: false },
  },
  {
    title: "Funded by players, not investors",
    body: "No ads and no subscriptions. Running costs are covered by supporters on Buy Me a Coffee, which is the whole business model.",
    link: {
      href: "https://buymeacoffee.com/riffquest",
      label: "See the supporter page",
      external: true,
    },
  },
  {
    title: "Ask the community before you sign up",
    body: "A small, active Discord where the developer answers questions and players share routines and plans.",
    link: {
      href: DISCORD_INVITE_URL,
      label: "Join the Discord",
      external: true,
    },
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
          <h2 className='font-landingHeading text-3xl font-extrabold leading-tight tracking-[-0.03em] text-ivory-fg sm:text-4xl lg:text-5xl'>
            Loved by guitarists who show up.
          </h2>
          <p className='mt-4 max-w-xl text-base leading-relaxed text-ivory-muted'>
            Four players, in their own words. The hours next to each name come
            from their own practice logs.
          </p>
        </Reveal>

        <Reveal
          delay={0.05}
          className='mb-6 flex flex-col gap-6 rounded-lg bg-ivory-surface p-6 sm:gap-8 sm:p-10 lg:flex-row lg:items-center'>
          <Quote className='h-9 w-9 shrink-0 text-ivory-accent' />
          <p className='flex-1 text-base leading-relaxed text-ivory-fg sm:text-xl'>
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

        <Reveal
          delay={0.15}
          className='mt-6 grid grid-cols-1 gap-10 rounded-lg bg-ivory-surface p-6 sm:grid-cols-3 sm:gap-8 sm:p-10'>
          {trustFacts.map((fact) => (
            <div key={fact.title} className='flex max-w-sm flex-col'>
              <h3 className='mb-2 text-base font-bold tracking-tight text-ivory-fg'>
                {fact.title}
              </h3>
              <p className='mb-4 flex-1 text-sm leading-relaxed text-ivory-muted'>
                {fact.body}
              </p>
              <Link
                href={fact.link.href}
                target={fact.link.external ? "_blank" : undefined}
                rel={fact.link.external ? "noopener noreferrer" : undefined}
                className='mt-auto inline-flex items-center gap-1 self-start text-sm font-bold text-ivory-accent transition-colors hover:text-ivory-fg'>
                {fact.link.label}
                <ArrowRight className='h-3.5 w-3.5' aria-hidden='true' />
              </Link>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
};
