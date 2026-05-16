import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";

export const SongCardSkeleton = () => {
  return (
    <div 
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-lg bg-zinc-900/40 p-5 backdrop-blur-md",
        "w-full h-[236px]"
      )}
    >
      {/* Header Section with Bleed Cover */}
      <div className="relative flex items-start">
        {/* Corner-Bleed Cover Image Skeleton */}
        <div className="relative -ml-5 -mt-5 shrink-0">
          <Skeleton className="h-28 w-28 rounded-br-lg" />
        </div>
        
        <div className="min-w-0 flex-1 pl-4 -mt-0.5 space-y-2">
            {/* Title Skeleton */}
            <Skeleton className="h-5 w-3/4 rounded-[4px]" />
            {/* Artist Skeleton */}
            <Skeleton className="h-4 w-1/2 rounded-[4px]" />
            
            <div className="mt-4 flex items-center gap-2">
               <Skeleton className="h-3 w-8 rounded-[4px]" />
               <Skeleton className="h-1 w-1 rounded-[4px]" />
               <Skeleton className="h-3 w-12 rounded-[4px]" />
            </div>
        </div>
      </div>

      {/* Stats Section: Difficulty Meter */}
      <div className="relative mb-6 space-y-2">
         <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-16 rounded-[4px]" />
            <Skeleton className="h-4 w-8 rounded-[4px]" />
         </div>
         <div className="h-1 w-full overflow-hidden rounded-[4px] bg-black/20">
            <Skeleton className="h-full w-2/3 rounded-[4px]" />
         </div>
      </div>

      {/* Footer Section */}
      <div className="relative mt-auto flex items-center gap-2">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
};
