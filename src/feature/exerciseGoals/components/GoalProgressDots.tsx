import { cn } from "assets/lib/utils";

import { GOAL_CLEAN_RUNS_REQUIRED } from "../utils/goalRules";

interface GoalProgressDotsProps {
  cleanRuns: number;
  className?: string;
}

/** One dot per clean run the goal needs, filled for the ones already played. */
export const GoalProgressDots = ({
  cleanRuns,
  className,
}: GoalProgressDotsProps) => (
  <div className={cn("flex items-center gap-1.5", className)} aria-hidden>
    {Array.from({ length: GOAL_CLEAN_RUNS_REQUIRED }, (_, index) => (
      <span
        key={index}
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          index < cleanRuns ? "bg-emerald-400" : "bg-zinc-700",
        )}
      />
    ))}
  </div>
);
