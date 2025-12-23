import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";

export const SongCardSkeleton = () => {
  return (
    <div 
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-md",
        "w-full h-[236px]"
      )}
    >
      {/* Header Section */}
      <div className="flex items-start gap-4">
        {/* Cover Image Skeleton */}
        <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
        
        <div className="min-w-0 flex-1 pt-1 space-y-2">
            {/* Title Skeleton */}
            <Skeleton className="h-5 w-3/4 rounded-md" />
            {/* Artist Skeleton */}
            <Skeleton className="h-4 w-1/2 rounded-md" />
            
            <div className="mt-4 flex items-center gap-3">
               <Skeleton className="h-3 w-8 rounded-full" />
               <Skeleton className="h-3 w-12 rounded-full" />
            </div>
        </div>
      </div>

      {/* Difficulty Section */}
      <div className="mt-6 space-y-2">
         <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-8" />
         </div>
         <Skeleton className="h-1.5 w-full rounded-full" />
      </div>

      {/* Footer Section */}
      <div className="mt-auto pt-4">
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>
    </div>
  );
};
