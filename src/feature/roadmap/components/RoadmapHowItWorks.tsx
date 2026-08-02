import { HeroPattern } from "components/UI/HeroBanner";
import { ChevronRight, Coins, PartyPopper, Route, Unlock } from "lucide-react";

const STEPS = [
  { icon: Coins, label: "You chip in" },
  { icon: Unlock, label: "A goal gets reached" },
  { icon: PartyPopper, label: "It ships for everyone" },
];

/**
 * Purely explanatory block — no stats, no CTA. Same single-row shell as
 * RoadmapPitch, but the right side is a 3-step icon flow instead of a stat,
 * since there is nothing to measure here, just something to explain quickly.
 */
export const RoadmapHowItWorks = () => {
  return (
    <section className='relative overflow-hidden rounded-lg bg-zinc-900/40 p-5 sm:p-7'>
      <HeroPattern
        className='opacity-[0.06]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
      />
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent' />
      <div className='relative flex flex-wrap items-center gap-x-12 gap-y-6'>
        <div className='flex min-w-0 flex-1 items-start gap-3.5'>
          <Route size={18} className='mt-0.5 shrink-0 text-cyan-400' />
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-zinc-100 sm:text-base'>
              How the roadmap works
            </p>
            <p className='mt-1 text-xs leading-relaxed text-zinc-400 sm:text-sm'>
              It&apos;s a running total, not a subscription. Every goal it
              crosses gets built and stays unlocked for everyone, for good.
            </p>
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-2.5 sm:gap-3.5'>
          {STEPS.map(({ icon: Icon, label }, i) => (
            <div key={label} className='flex items-center gap-2.5 sm:gap-3.5'>
              <div className='flex flex-col items-center gap-1.5 text-center'>
                <span className='flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
                  <Icon size={18} />
                </span>
                <span className='max-w-[72px] text-[11px] font-medium leading-tight text-zinc-400'>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight
                  size={16}
                  className='shrink-0 text-zinc-700'
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
