import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { Flame, HeartPulse, Swords, Timer } from "lucide-react";

import type { BreakdownIcon, BreakdownRow } from "../utils/rewardBreakdown";

// The parts of a reward, listed under the number they add up to. Deliberately
// quieter than that number: these explain where it came from, they are not more
// numbers to add to it. See `utils/rewardBreakdown` for why that matters.

const ICONS: Record<BreakdownIcon, typeof Timer> = {
  time: Timer,
  habits: HeartPulse,
  streak: Flame,
  rig: Swords,
};

interface RewardBreakdownProps {
  rows: BreakdownRow[];
  /** Animation start, so a list can land after the number it belongs to. */
  delay?: number;
  className?: string;
}

export const RewardBreakdown = ({ rows, delay = 0.6, className }: RewardBreakdownProps) => {
  // A single line with nothing under it only repeats the headline above it.
  if (rows.length === 0 || (rows.length === 1 && rows[0].subs.length === 0)) return null;

  return (
    <div className={cn("mx-auto flex max-w-xs flex-col gap-4 text-left", className)}>
      {rows.map((row, i) => {
        const Icon = ICONS[row.icon];
        return (
          <motion.div
            key={row.key}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + i * 0.12, duration: 0.35, ease: "easeOut" }}
          >
            <div className="flex items-center gap-2.5">
              <Icon size={15} className="shrink-0 text-zinc-400" aria-hidden />
              <span className="flex-1 text-sm text-zinc-300">{row.label}</span>
              <span className="text-sm font-bold tabular-nums text-zinc-100">+{row.amount}</span>
            </div>

            {row.subs.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 pl-[26px]">
                {row.subs.map((sub) => (
                  <div key={sub.key} className="flex items-center gap-2">
                    <span className={cn("flex-1 text-xs", sub.muted ? "text-zinc-500" : "text-zinc-400")}>
                      {sub.label}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        sub.muted ? "text-zinc-500" : "text-zinc-300"
                      )}
                    >
                      {sub.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
