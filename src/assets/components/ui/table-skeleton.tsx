import { Skeleton } from "assets/components/ui/skeleton"
import { cn } from "assets/lib/utils"

interface TableSkeletonProps {
  rows?: number
  className?: string
}

export function TableSkeleton({ rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-6", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="relative overflow-hidden radius-premium glass-card p-4 sm:p-6"
        >
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Rank Skeleton */}
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-white/5" />
            
            {/* Avatar Skeleton */}
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/5" />
            
            {/* Info Skeleton */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32 sm:w-48 bg-white/10" />
              <Skeleton className="h-3 w-20 sm:w-32 bg-white/5" />
            </div>
            
            {/* Stats Skeleton */}
            <div className="hidden sm:flex items-center gap-8 lg:gap-12">
               <div className="space-y-2">
                 <Skeleton className="h-6 w-16 bg-white/10" />
                 <Skeleton className="h-2 w-10 mx-auto bg-white/5" />
               </div>
               <div className="space-y-2">
                 <Skeleton className="h-6 w-16 bg-white/10" />
                 <Skeleton className="h-2 w-10 mx-auto bg-white/5" />
               </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
