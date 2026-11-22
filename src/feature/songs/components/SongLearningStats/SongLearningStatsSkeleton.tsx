import { Skeleton } from "assets/components/ui/skeleton";

export const SongLearningStatsSkeleton = () => {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className='flex flex-col gap-2.5 rounded-lg bg-zinc-800/40 p-5'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-7 w-16' />
          <Skeleton className='h-3 w-28' />
        </div>
      ))}
    </div>
  );
};
