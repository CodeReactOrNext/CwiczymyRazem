import { cn } from "assets/lib/utils";
import type { WorkshopCheck } from "feature/arsenal/data/workshop";
import { getGradeByRank } from "feature/arsenal/data/workshop";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface RequirementListProps {
  checks: WorkshopCheck[];
}

/** Reads a check as the "x of y" line the player sees under it. */
const formatProgress = (check: WorkshopCheck): string => {
  if (check.kind === "condition") {
    const current = getGradeByRank(check.current);
    return check.ok ? current.label : `${current.label} → ${check.detail}`;
  }
  if (check.kind === "parts") {
    return `${check.current.toLocaleString()} / ${check.required.toLocaleString()} pp`;
  }
  if (check.kind === "fame") {
    return `${check.current.toLocaleString()} / ${check.required.toLocaleString()}`;
  }
  return `${check.current} / ${check.required}`;
};

/**
 * The recipe as a checklist with progress. Showing *how close* an unmet
 * requirement is matters more than showing that it failed — the near-miss is what
 * sends the player back to scrap two more pedals.
 */
export const RequirementList = ({ checks }: RequirementListProps) => (
  <div className='flex flex-col gap-4'>
    {checks.map((check) => {
      const pct =
        check.required > 0 ? Math.min(1, check.current / check.required) : 1;

      return (
        <div key={check.kind} className='flex flex-col gap-2'>
          <div className='flex items-baseline justify-between gap-4'>
            <span className='flex items-center gap-2'>
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  check.ok ? "bg-emerald-500/15" : "bg-zinc-800",
                )}>
                {check.ok ? (
                  <Check
                    size={10}
                    strokeWidth={3}
                    className='text-emerald-400'
                  />
                ) : (
                  <span className='h-1 w-1 rounded-full bg-zinc-500' />
                )}
              </span>
              <span
                className={cn(
                  "text-xs",
                  check.ok ? "text-zinc-300" : "text-zinc-400",
                )}>
                {check.label}
              </span>
            </span>

            <span
              className={cn(
                "text-xs tabular-nums",
                check.ok ? "text-emerald-400" : "text-zinc-400",
              )}>
              {formatProgress(check)}
            </span>
          </div>

          <div className='h-1 overflow-hidden rounded-full bg-zinc-800'>
            <motion.div
              className={cn(
                "h-full rounded-full",
                check.ok ? "bg-emerald-400" : "bg-cyan-500/70",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      );
    })}
  </div>
);
