import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { PAGE_CONTENT, PageShell } from "components/PageShell/PageShell";

/**
 * A member profile while its document loads: the banner with the name, then
 * the sections — the containers and padding of `ProfileLayout` and
 * `HeroBanner`, so the profile fills in where the placeholders were.
 */
export const ProfileSkeleton = () => (
  <PageShell
    aria-busy='true'
    aria-label='Loading'
    className='overflow-hidden md:overflow-visible'>
    <div className='space-y-2 p-6 md:p-8 lg:px-10 lg:py-8'>
      <Skeleton className='h-3 w-24' />
      <Skeleton className='h-8 w-56 max-w-full md:h-9' />
      <Skeleton className='h-4 w-72 max-w-full' />
    </div>

    <div className={cn("space-y-8", PAGE_CONTENT)}>
      <Skeleton variant='block' className='h-40' />
      <div className='grid gap-8 md:grid-cols-2'>
        <Skeleton variant='block' className='h-56' />
        <Skeleton variant='block' className='h-56' />
      </div>
    </div>
  </PageShell>
);
