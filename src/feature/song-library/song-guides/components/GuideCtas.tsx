import { Button } from "assets/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { SongGuide } from "../types";

interface GuideCtaProps {
  guide: SongGuide;
  /** Album cover reused from live data — purely decorative here. */
  coverUrl?: string | null;
}

export const GuideInlineCta = ({ guide, coverUrl }: GuideCtaProps) => {
  return (
    <section className='mx-auto w-full max-w-5xl px-6 py-10'>
      <div className='flex flex-col items-start gap-6 rounded-lg bg-cyan-500/10 p-8 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-5'>
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=''
              aria-hidden='true'
              width={64}
              height={64}
              className='hidden h-16 w-16 shrink-0 rounded-lg object-cover sm:block'
            />
          )}
          <div>
            <h2 className='font-display mb-2 text-xl font-bold text-zinc-100'>
              {guide.inlineCta.heading}
            </h2>
            <p className='max-w-xl text-sm leading-relaxed text-zinc-400'>
              {guide.inlineCta.text}
            </p>
          </div>
        </div>
        <Link href='/signup' className='shrink-0'>
          <Button className='h-9 rounded-lg bg-cyan-500 px-5 text-sm font-bold text-black transition-colors hover:bg-cyan-400'>
            Start free
            <ArrowRight className='ml-1.5 h-4 w-4' />
          </Button>
        </Link>
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
