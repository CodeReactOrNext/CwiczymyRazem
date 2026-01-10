import { Skeleton } from "assets/components/ui/skeleton";

export const SongLearningStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-1 items-center gap-4 rounded-lg p-4"
        >
          {/* Icon placeholder */}
           <Skeleton className="h-10 w-10 rounded-lg" />

          {/* Text placeholders */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
};
