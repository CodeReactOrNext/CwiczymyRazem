/**
 * Loading placeholder for the roadmap card. Mirrors FundingProgressBar's
 * header, track and tier boxes so the page doesn't jump once the API responds.
 */
export const FundingProgressBarSkeleton = () => {
  return (
    <section
      className='w-full animate-pulse rounded-lg bg-zinc-900/40 p-5 sm:p-6'
      aria-hidden>
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-2'>
          <div className='h-3 w-28 rounded bg-zinc-800' />
          <div className='h-3 w-72 max-w-full rounded bg-zinc-800' />
        </div>
        <div className='h-8 w-12 rounded bg-zinc-800' />
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
  );
};
