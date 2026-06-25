import { Skeleton } from "assets/components/ui/skeleton"
import { cn } from "assets/lib/utils"

interface TableSkeletonProps {
  rows?: number
  className?: string
}

/**
 * Mirrors the structure of `LeadboardRow` (both its mobile vertical-stack
 * layout and its desktop row layout) so the leaderboard / seasonal cards do
 * not shift when the real data loads in.
 */
export function TableSkeleton({ rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-6", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl glass-card"
        >
          {/* --- Mobile Layout (<640px) --- */}
          <div className="relative z-10 flex flex-col gap-4 p-4 sm:hidden">
            {/* Header: Rank, Avatar, Name */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg bg-white/5" />
              <div className="flex flex-1 items-center gap-3 overflow-hidden">
                <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full bg-white/5" />
                <div className="flex min-w-0 flex-col gap-1">
                  <Skeleton className="h-4 w-28 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-11 rounded-sm bg-white/5" />
                    <Skeleton className="h-3 w-16 bg-white/5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid - Card within a Card */}
            <div className="grid grid-cols-2 divide-x divide-white/5 rounded-xl bg-black/20">
              <div className="flex flex-col items-center justify-center gap-1 py-3">
                <Skeleton className="h-6 w-14 bg-white/10" />
                <Skeleton className="h-2.5 w-10 bg-white/5" />
              </div>
              <div className="flex flex-col items-center justify-center gap-1 py-3">
                <Skeleton className="h-6 w-14 bg-white/10" />
                <Skeleton className="h-2.5 w-10 bg-white/5" />
              </div>
            </div>

            {/* Achievements Footer (carousel: icon pill + label) */}
            <div className="flex flex-col items-center gap-1.5 pt-3">
              <Skeleton className="h-9 w-40 rounded-lg bg-white/5" />
              <Skeleton className="h-2.5 w-24 bg-white/5" />
            </div>
          </div>

          {/* --- Desktop Layout (>=640px) --- */}
          <div className="relative z-10 hidden items-center gap-3 p-4 sm:flex sm:gap-5 sm:p-5 lg:gap-8 lg:p-6">
            {/* Rank */}
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg bg-white/5 sm:h-12 sm:w-12 lg:h-14 lg:w-14" />

            {/* Avatar */}
            <Skeleton className="h-20 w-20 flex-shrink-0 rounded-xl bg-white/5" />

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-4">
                <Skeleton className="h-7 w-40 bg-white/10" />
                <Skeleton className="h-8 w-16 rounded-sm bg-white/5" />
              </div>
              {/* DaySince: status dot + small text */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-1.5 w-1.5 rounded-full bg-white/10" />
                <Skeleton className="h-3 w-28 bg-white/5" />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 lg:gap-12">
              <div className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-7 w-16 bg-white/10" />
                <Skeleton className="h-2.5 w-12 bg-white/5" />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-7 w-16 bg-white/10" />
                <Skeleton className="h-2.5 w-12 bg-white/5" />
              </div>
            </div>

            {/* Achievements - Desktop (lg only, carousel: icon pill + label) */}
            <div className="hidden flex-shrink-0 flex-col items-center gap-1.5 lg:flex">
              <Skeleton className="h-10 w-36 rounded-lg bg-white/5" />
              <Skeleton className="h-2.5 w-24 bg-white/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
