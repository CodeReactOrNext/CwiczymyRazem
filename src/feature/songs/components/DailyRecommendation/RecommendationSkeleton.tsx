import { Skeleton } from "assets/components/ui/skeleton";

export const RecommendationSkeleton = ({ type = "song" }: { type?: "song" | "exercise" | "progress" }) => {
  if (type === "exercise") {
    return (
      <div className="rounded-lg bg-zinc-800/40 p-5" aria-busy="true">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-4">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (type === "progress") {
    return (
      <div className="rounded-lg bg-zinc-800/40 p-6 h-[120px] flex flex-col justify-center" aria-busy="true">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-20" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-6 w-12 ml-auto" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-zinc-800/40 p-6" aria-busy="true">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <Skeleton className="h-24 w-24 rounded-lg" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-4 lg:pt-0">
          <Skeleton className="h-11 w-32 rounded-lg" />
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
};
