import { Skeleton } from "assets/components/ui/skeleton";

/**
 * Placeholder for a page whose data is still on the way: the rough shape of a page
 * (title, a wide block, a row of cards) rather than a spinner in an empty area, so
 * the content arriving reads as filling in, not as the screen being replaced.
 */
const PageLoadingLayout = () => {
  return (
    <div aria-busy='true' aria-label='Loading' className='w-full space-y-6 px-4 py-6 md:px-0'>
      <div className='space-y-3'>
        <Skeleton className='h-7 w-48' />
        <Skeleton className='h-4 w-72 max-w-full' />
      </div>
      <Skeleton className='h-44 w-full rounded-lg' />
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Skeleton className='h-32 rounded-lg' />
        <Skeleton className='h-32 rounded-lg' />
        <Skeleton className='hidden h-32 rounded-lg lg:block' />
      </div>
    </div>
  );
};
export default PageLoadingLayout;
