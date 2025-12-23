import { cn } from "assets/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-800/80", className)}
      {...props}
    />
  )
}

export { Skeleton }
