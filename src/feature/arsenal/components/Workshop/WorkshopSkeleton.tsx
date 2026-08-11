import { Skeleton } from "assets/components/ui/skeleton";

/**
 * The workshop while the inventory is still in flight.
 *
 * Shaped like the real thing — rack on the left, item plus three job cards on
 * the right — because the alternative was an empty state telling a player with a
 * full rack to go and open a case.
 */
export const WorkshopSkeleton = () => (
  <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start'>
    <div className='order-2 flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-5 lg:order-1'>
      <Skeleton className='h-5 w-24 rounded-lg bg-zinc-800/60' />
      <Skeleton className='h-9 w-full rounded-lg bg-zinc-800/60' />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className='h-16 w-full rounded-lg bg-zinc-800/40' />
      ))}
    </div>

    <div className='order-1 flex flex-col gap-4 lg:order-2'>
      <Skeleton className='h-44 w-full rounded-lg bg-zinc-800/50' />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className='h-24 w-full rounded-lg bg-zinc-800/40' />
      ))}
    </div>
  </div>
);
