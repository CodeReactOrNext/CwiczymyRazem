import { Skeleton } from "assets/components/ui/skeleton"
import { cn } from "assets/lib/utils"

interface TableSkeletonProps {
  rows?: number
  className?: string
}

/**
 * Mirrors the structure of `LeadboardRow` (both its one-line mobile row
 * and its desktop row layout) so the leaderboard / seasonal cards do
 * not shift when the real data loads in.
 */
export function TableSkeleton({ rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-1.5 sm:space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-xl glass-card"
        >
          {/* --- Mobile Layout (<640px): one line per player --- */}
          <div className="relative z-10 flex items-center gap-3 px-3 py-3 sm:hidden">
            <Skeleton className="h-4 w-8 flex-shrink-0 bg-white/5" />
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full bg-white/5" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-28 bg-white/10" />
              <Skeleton className="h-3 w-36 bg-white/5" />
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
              <Skeleton className="h-4 w-12 bg-white/10" />
              <Skeleton className="h-3 w-8 bg-white/5" />
            </div>
          </div>

          {/* --- Desktop Layout (>=640px): one low card per player --- */}
          <div className="relative z-10 hidden h-[5.25rem] items-center gap-5 px-5 sm:flex">
            <Skeleton className="h-9 w-10 flex-shrink-0 rounded-[0.625rem] bg-white/5" />
            <Skeleton className="h-14 w-14 flex-shrink-0 rounded-xl bg-white/5" />
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <Skeleton className="h-5 w-40 bg-white/10" />
            </div>
            <Skeleton className="h-7 w-24 flex-shrink-0 bg-white/10" />
            <Skeleton className="h-4 w-14 flex-shrink-0 bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  )
}
