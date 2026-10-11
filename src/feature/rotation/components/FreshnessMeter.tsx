import { cn } from "assets/lib/utils";

import type { FreshnessLevel, ItemFreshness } from "../types/rotation.types";

const SEGMENTS = 5;

export const LEVEL_TEXT: Record<FreshnessLevel, string> = {
  rusty: "text-orange-400",
  cooling: "text-zinc-300",
  fresh: "text-emerald-400",
};

const LEVEL_FILL: Record<FreshnessLevel, string> = {
  rusty: "bg-orange-400",
  cooling: "bg-zinc-300",
  fresh: "bg-emerald-400",
};

/**
 * Five pips that drain as an item goes unplayed — full the day it was played,
 * empty three weeks later. Decorative: the label beside it says the same in words.
 */
export const FreshnessMeter = ({
  freshness,
  className,
}: {
  freshness: ItemFreshness;
  className?: string;
}) => {
  const filled = Math.ceil(freshness.freshness * SEGMENTS);
  return (
    <div className={cn("flex items-center gap-1", className)} aria-hidden>
      {Array.from({ length: SEGMENTS }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 w-3 rounded-full transition-colors duration-500",
            index < filled ? LEVEL_FILL[freshness.level] : "bg-zinc-800",
          )}
        />
      ))}
    </div>
  );
};
