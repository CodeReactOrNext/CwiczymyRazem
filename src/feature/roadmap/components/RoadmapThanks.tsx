import { SupportCta } from "./SupportCta";

/**
 * The closing ask, for people who read to the bottom before deciding, and
 * for the ones who never cared about tiers and just want to say thanks.
 */
export const RoadmapThanks = () => {
  return (
    <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-7'>
      <div className='flex flex-wrap items-center gap-x-12 gap-y-6'>
        {/* Full width until lg: the shrink-0 CTA would otherwise squeeze the
            copy down to a word per line on a phone. */}
        <div className='w-full min-w-0 lg:w-auto lg:flex-1'>
          <p className='text-base font-semibold text-zinc-100'>
            Just want to say thanks?
          </p>
          <p className='mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400'>
            Knowing Riff Quest is useful to you is already the good part. A
            coffee on top of that genuinely makes my day.
          </p>
        </div>

        <SupportCta className='w-full sm:w-auto'>
          Say thanks with a coffee
        </SupportCta>
      </div>
    </section>
  );
};
