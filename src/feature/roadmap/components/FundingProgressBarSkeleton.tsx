/**
 * Loading placeholder for the funding section. Mirrors the two-card layout of
 * FundingProgressBar so the page doesn't jump once the API responds.
 */
export const FundingProgressBarSkeleton = () => {
  return (
    <div className='w-full animate-pulse space-y-4' aria-hidden>
      {/* Card 1 — status */}
      <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-2'>
            <div className='h-3 w-24 rounded bg-zinc-800' />
            <div className='h-12 w-28 rounded bg-zinc-800' />
            <div className='h-3 w-32 rounded bg-zinc-800' />
          </div>
          <div className='h-11 w-44 rounded-lg bg-zinc-800' />
        </div>

        {/* Server cost line */}
        <div className='mt-4 flex items-center gap-3'>
          <div className='h-4 w-4 shrink-0 rounded bg-zinc-800' />
          <div className='h-3 w-32 shrink-0 rounded bg-zinc-800' />
          <div className='h-1.5 flex-1 rounded-full bg-zinc-800' />
          <div className='h-3 w-16 shrink-0 rounded bg-zinc-800' />
        </div>
      </section>

      {/* Card 2 — roadmap */}
      <section className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        <div className='mb-4 space-y-2'>
          <div className='h-3 w-28 rounded bg-zinc-800' />
          <div className='h-3 w-72 max-w-full rounded bg-zinc-800' />
        </div>

        {/* Track */}
        <div className='mt-10 h-[18px] w-full rounded-full bg-zinc-800' />

        {/* Tier boxes */}
        <div className='mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='h-24 rounded-lg bg-zinc-800/60' />
          ))}
        </div>
      </section>
    </div>
  );
};
