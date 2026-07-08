import { Skeleton } from "assets/components/ui/skeleton";

export const SongCardSkeleton = () => {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-md p-3">
      {/* Cover (mirrors SongCard) */}
      <Skeleton className="aspect-square w-full rounded-md" />

      {/* Info - row heights mirror SongCard exactly to avoid layout shift */}
      <div className="flex flex-col pt-3">
        {/* Title row (text-base → 24px line box) */}
        <div className="flex h-6 items-center justify-between gap-2">
          <Skeleton className="h-4 w-2/3 rounded-[4px]" />
          <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
        </div>

        {/* Artist row (mt-1 + text-sm → 20px line box) */}
        <div className="mt-1 flex h-5 items-center">
          <Skeleton className="h-3.5 w-1/3 rounded-[4px]" />
        </div>

        {/* Bottom row (mt-3.5 + 22px badge): stats left, tier badge right */}
        <div className="mt-3.5 flex h-[22px] items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-8 rounded-[4px]" />
            <Skeleton className="h-1 w-1 rounded-full" />
            <Skeleton className="h-3 w-12 rounded-[4px]" />
          </div>
          <Skeleton className="h-[22px] w-12 shrink-0 rounded-[4px]" />
        </div>
      </div>
    </div>
  );
};
