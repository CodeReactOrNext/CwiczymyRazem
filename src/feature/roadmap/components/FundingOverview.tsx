import { Coffee } from "lucide-react";

import { MONTHLY_RUNNING_COST } from "../data/roadmap.data";

const BMC_URL = "https://buymeacoffee.com/riffquest";

/**
 * Quiet explainer that sits *below* the roadmap. Mostly text, one accent.
 */
export const FundingOverview = () => {
  return (
    <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <h2 className='text-sm font-semibold text-zinc-200'>How this works</h2>

      <div className='mt-3 space-y-3 text-sm leading-relaxed text-zinc-400'>
        <p>
          Riff Quest is funded by the community on Buy Me a Coffee. Running it
          costs about{" "}
          <span className='text-zinc-200'>${MONTHLY_RUNNING_COST}/month</span> for
          hosting and tools, and that cost gets covered first so the app can stay
          free for everyone who uses it.
        </p>
        <p>
          Everything raised on top of that goes into the roadmap. As the total
          climbs it crosses the goals on the bar above, and each goal that gets
          reached unlocks something new. Sometimes that is a big feature, and
          sometimes it is a fresh batch of content like new guitars, exercises,
          practice plans and journeys.
        </p>
        <p>
          It works as a running total, not a subscription. Once a goal has been
          reached it stays unlocked for good, so nothing you help pay for ever
          gets taken away.
        </p>
      </div>

      <a
        href={BMC_URL}
        target='_blank'
        rel='noopener noreferrer'
        className='mt-5 inline-flex items-center gap-2 text-sm font-medium text-amber-400 transition-colors hover:text-amber-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/50'>
        <Coffee size={16} />
        Buy me a coffee
      </a>
    </section>
  );
};
