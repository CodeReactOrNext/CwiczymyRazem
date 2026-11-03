import { Skeleton } from "assets/components/ui/skeleton";

/**
 * A member profile while its document loads: the banner with the name, then
 * the sections — the containers and padding of `ProfileLayout` and
 * `HeroBanner`, so the profile fills in where the placeholders were.
 */
export const ProfileSkeleton = () => (
  <div
    aria-busy='true'
    aria-label='Loading'
    className='flex flex-col overflow-hidden rounded-xl bg-second-600 md:overflow-visible'>
    <div className='space-y-2 p-6 md:p-8 lg:px-10 lg:py-8'>
      <Skeleton className='h-3 w-24' />
      <Skeleton className='h-8 w-56 max-w-full md:h-9' />
      <Skeleton className='h-4 w-72 max-w-full' />
    </div>

    <div className='space-y-8 p-4 md:p-6'>
      <Skeleton variant='block' className='h-40' />
      <div className='grid gap-8 md:grid-cols-2'>
        <Skeleton variant='block' className='h-56' />
        <Skeleton variant='block' className='h-56' />
      </div>
    </div>
  </div>
);
