import { Skeleton } from "assets/components/ui/skeleton";

export const SongCardSkeleton = () => {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-lg bg-zinc-800/40 p-4">
      <div className="flex items-stretch gap-4">
        {/* Cover */}
        <Skeleton className="h-24 w-24 shrink-0 rounded-lg" />

        {/* Metadata */}
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Title + difficulty chip */}
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-1/2 rounded-[4px]" />
            <Skeleton className="h-7 w-14 shrink-0 rounded-[4px]" />
          </div>

          {/* Artist */}
          <Skeleton className="mt-1.5 h-4 w-1/3 rounded-[4px]" />

          {/* Bottom metadata row */}
          <div className="mt-auto flex items-center gap-2 pt-2">
            <Skeleton className="h-3 w-8 rounded-[4px]" />
            <Skeleton className="h-1 w-1 rounded-full" />
            <Skeleton className="h-3 w-12 rounded-[4px]" />
          </div>
        </div>
      </div>
    </div>
  );
};
