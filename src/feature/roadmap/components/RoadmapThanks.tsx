import { HeroPattern } from "components/UI/HeroBanner";
import { Coffee, PartyPopper } from "lucide-react";

const BMC_URL = "https://buymeacoffee.com/riffquest";

/**
 * The "no strings attached" block — for people who don't care about the
 * roadmap tiers and just want to say thanks. Purple, since it's the one
 * accent not already claimed by cost (orange) or goals (cyan/emerald) above.
 */
export const RoadmapThanks = () => {
  return (
    <section className='relative overflow-hidden rounded-lg bg-zinc-900/40 p-5 sm:p-7'>
      <HeroPattern
        className='opacity-[0.06]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
      />
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-transparent' />
      <div className='relative flex flex-wrap items-center gap-x-12 gap-y-6'>
        <div className='flex min-w-0 flex-1 items-start gap-3.5'>
          <PartyPopper size={18} className='mt-0.5 shrink-0 text-purple-400' />
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-zinc-100 sm:text-base'>
              Just want to say thanks?
            </p>
            <p className='mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm'>
              Some support isn&apos;t about unlocking anything. Knowing Riff
              Quest is useful to you is already the good part — a coffee on top
              of that genuinely makes my day.
            </p>
          </div>
        </div>

        <a
          href={BMC_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='flex shrink-0 items-center gap-1.5 rounded-lg bg-purple-500/15 px-4 py-2.5 text-xs font-semibold text-purple-300 transition-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 hover:bg-purple-500/25 sm:text-sm'>
          <Coffee size={16} />
          Say thanks with a coffee
        </a>
      </div>
    </section>
  );
};
