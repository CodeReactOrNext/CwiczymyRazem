import { cn } from "assets/lib/utils";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type { RecipeLine } from "feature/arsenal/data/workshop";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { PartIcon } from "../Parts/PartIcon";

interface PartTallyProps {
  line: RecipeLine;
  /** `full` names the part; `compact` is for rows where a dozen bills are compared. */
  variant?: "full" | "compact";
  /** Staggers the entry animation when a list renders. */
  index?: number;
}

/**
 * One ingredient: what it is, how many are held, how many the job wants.
 *
 * Held-over-needed is always shown, never just the requirement. A bare "14×" makes
 * the player go and count their own screws; "3 / 14" answers the only question
 * they actually have, and the shortfall underneath answers the next one.
 */
export const PartTally = ({
  line,
  variant = "full",
  index = 0,
}: PartTallyProps) => {
  const compact = variant === "compact";

  return (
    <motion.span
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
      title={`${getPartLabel(line.partId)} (${line.tier}) — you hold ${line.have}, this needs ${line.need}`}
      className={cn(
        "flex items-center rounded-lg",
        compact ? "gap-2 py-1.5 pl-1.5 pr-3" : "gap-3.5 px-4 py-3",
        line.ok ? "bg-zinc-800/50" : "bg-zinc-800/25",
      )}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center",
          compact ? "h-8 w-8" : "h-12 w-12",
          !line.ok && "opacity-40 grayscale",
        )}>
        <PartIcon partId={line.partId} size={compact ? 30 : 44} />
      </span>

      {!compact && (
        <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <span className='text-base font-bold text-zinc-100'>
            {getPartLabel(line.partId)}
          </span>
          <span
            className='text-sm font-semibold'
            style={{ color: PART_TIER_COLORS[line.tier] }}>
            {line.tier}
          </span>
        </span>
      )}

      <span className='flex shrink-0 items-center gap-2'>
        <span className='flex flex-col items-end gap-0.5'>
          <span
            className={cn(
              "font-black tabular-nums",
              compact ? "text-sm" : "text-lg",
              line.ok ? "text-zinc-100" : "text-amber-400",
            )}>
            <span className={line.ok ? undefined : "text-amber-400"}>
              {line.have}
            </span>
            <span className='text-zinc-600'> / </span>
            {line.need}
          </span>

          {!line.ok && !compact && (
            <span className='text-sm text-amber-400/80'>
              {line.need - line.have} short
            </span>
          )}
        </span>

        {compact ? (
          <span
            className='text-xs font-semibold'
            style={{ color: PART_TIER_COLORS[line.tier] }}>
            {line.tier}
          </span>
        ) : (
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              line.ok ? "bg-emerald-500/15" : "bg-zinc-800",
            )}>
            {line.ok ? (
              <Check size={13} strokeWidth={3} className='text-emerald-400' />
            ) : (
              <span className='h-1.5 w-1.5 rounded-full bg-zinc-600' />
            )}
          </span>
        )}
      </span>
    </motion.span>
  );
};
