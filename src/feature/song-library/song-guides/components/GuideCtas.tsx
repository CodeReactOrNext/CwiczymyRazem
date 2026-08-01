import { Button } from "assets/components/ui/button";
import {
  ArrowRight,
  Clock,
  Library,
  ListChecks,
  Mic,
  Repeat,
} from "lucide-react";
import Link from "next/link";

import type { SongGuide } from "../types";

interface GuideCtaProps {
  guide: SongGuide;
  /** Album cover reused from live data — purely decorative here. */
  coverUrl?: string | null;
}

const inlineCtaFeatures = [
  {
    icon: Repeat,
    label: "Loop any section",
    desc: "Isolate the intro, solo, or chorus and loop just that part until it's clean.",
  },
  {
    icon: ListChecks,
    label: "Track what's left",
    desc: "Mark each section Mastered, Medium, Bad, or Not learned, so you always know what still needs work.",
  },
  {
    icon: Clock,
    label: "Time spent per song",
    desc: "Every practice minute is logged against the song itself, not just a generic timer.",
  },
  {
    icon: Library,
    label: "Your own song library",
    desc: "Build a library of the songs you actually know, ready to revisit any time.",
  },
  {
    icon: Mic,
    label: "Import your own tabs",
    desc: "Upload a Guitar Pro file and turn on real-time note recognition through your mic — the same engine behind the built-in exercises.",
  },
];

export const GuideInlineCta = ({ guide, coverUrl }: GuideCtaProps) => {
  return (
    <section className='mx-auto w-full max-w-5xl px-6 py-10'>
      <div className='overflow-hidden rounded-lg bg-cyan-500/10'>
        <div className='p-8 pb-0'>
          <div className='overflow-hidden rounded-lg bg-zinc-950/60 p-2'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src='/images/song-sections.png'
              alt='Song section tracker: loop a section, see per-section progress (Mastered, Medium, Bad, Not learned) across Intro, Verse, Solo, and Chorus'
              width={1028}
              height={450}
              className='h-auto w-full rounded-md'
            />
          </div>
        </div>
        <div className='p-8'>
          <div className='mb-4 flex items-center gap-3'>
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt=''
                aria-hidden='true'
                width={48}
                height={48}
                className='h-12 w-12 shrink-0 rounded-lg object-cover'
              />
            )}
            <h2 className='font-display text-xl font-bold text-zinc-100'>
              {guide.inlineCta.heading}
            </h2>
          </div>
          <p className='mb-6 max-w-xl text-sm leading-relaxed text-zinc-400'>
            {guide.inlineCta.text}
          </p>
          <ul className='mb-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2'>
            {inlineCtaFeatures.map((feature) => (
              <li key={feature.label} className='flex items-start gap-3'>
                <div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400'>
                  <feature.icon className='h-3.5 w-3.5' aria-hidden='true' />
                </div>
                <div>
                  <div className='text-sm font-bold text-zinc-100'>
                    {feature.label}
                  </div>
                  <div className='text-xs leading-relaxed text-zinc-400'>
                    {feature.desc}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Link href='/signup'>
            <Button className='h-9 rounded-lg bg-cyan-500 px-5 text-sm font-bold text-black transition-colors hover:bg-cyan-400'>
              Start free
              <ArrowRight className='ml-1.5 h-4 w-4' />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export const GuideFinalCta = ({ guide, coverUrl }: GuideCtaProps) => {
  return (
    <section className='relative overflow-hidden bg-black py-28'>
      <div className='absolute inset-0 z-0 overflow-hidden'>
        <div className='animate-glow-float-1 pointer-events-none absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/15 blur-[140px]' />
        <div className='animate-glow-float-2 pointer-events-none absolute bottom-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-sky-500/10 blur-[140px]' />
      </div>

      <div className='relative z-10 mx-auto max-w-3xl px-6 text-center'>
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=''
            aria-hidden='true'
            width={96}
            height={96}
            className='mx-auto mb-8 h-24 w-24 rounded-lg object-cover'
          />
        )}
        <h2 className='font-display mb-6 text-4xl font-bold leading-tight tracking-tighter text-white sm:text-5xl'>
          {guide.finalCta.headingTop}
          <br />
          <span className='animate-gradient bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-[length:200%_auto] bg-clip-text text-transparent'>
            {guide.finalCta.headingAccent}
          </span>
        </h2>
        <p className='mx-auto mb-10 max-w-xl leading-relaxed text-zinc-400'>
          {guide.finalCta.text}
        </p>
        <div className='flex flex-col items-center gap-3'>
          <Link href='/signup'>
            <Button className='h-12 rounded-lg bg-cyan-500 px-8 text-base font-bold text-black transition-colors hover:bg-cyan-400'>
              Start tracking this song free
              <ArrowRight className='ml-2 h-5 w-5' />
            </Button>
          </Link>
          <span className='text-xs text-zinc-500'>
            Already have an account?{" "}
            <Link
              href='/login'
              className='text-cyan-400 transition-colors hover:text-cyan-300'>
              Log in
            </Link>
          </span>
        </div>
      </div>
    </section>
  );
};
