
export const RecommendationSkeleton = ({ type = "song" }: { type?: "song" | "exercise" | "progress" }) => {
  if (type === "exercise") {
    return (
      <div className="animate-pulse rounded-xl border border-white/5 bg-zinc-900/50 p-5 backdrop-blur-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-2 w-16 bg-zinc-800 rounded" />
              <div className="h-4 w-32 bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="h-3 w-10 bg-zinc-800 rounded" />
            <div className="h-3 w-10 bg-zinc-800 rounded" />
            <div className="h-3 w-10 bg-zinc-800 rounded" />
          </div>
          <div className="h-9 w-full bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (type === "progress") {
    return (
      <div className="animate-pulse rounded-xl border border-white/5 bg-zinc-900/10 p-6 backdrop-blur-xl h-[120px] flex flex-col justify-center">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-zinc-800 rounded" />
            <div className="h-2 w-20 bg-zinc-800 rounded" />
          </div>
          <div className="text-right space-y-2">
            <div className="h-6 w-12 bg-zinc-800 rounded ml-auto" />
            <div className="h-2 w-16 bg-zinc-800 rounded" />
          </div>
        </div>
        <div className="h-2 w-full bg-zinc-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <div className="h-24 w-24 rounded-2xl bg-zinc-800" />
          <div className="space-y-3 pt-2">
            <div className="h-3 w-20 bg-zinc-800 rounded-full" />
            <div className="h-6 w-48 bg-zinc-800 rounded" />
            <div className="h-4 w-32 bg-zinc-800 rounded" />
            <div className="flex gap-4 pt-2">
              <div className="h-3 w-16 bg-zinc-800 rounded" />
              <div className="h-3 w-16 bg-zinc-800 rounded" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-4 lg:pt-0">
          <div className="h-11 w-32 bg-zinc-800 rounded-xl" />
          <div className="h-11 w-32 bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
