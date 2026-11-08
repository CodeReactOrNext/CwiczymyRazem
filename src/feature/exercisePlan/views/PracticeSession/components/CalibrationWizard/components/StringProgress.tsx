import { cn } from "assets/lib/utils";
import { Check } from "lucide-react";
import React from "react";

import type { GuitarString } from "../calibration.constants";

/** The open strings, low to high: tuned ones ticked, the current one lit. Tap one to go back to it. */
export const StringProgress = React.memo(function StringProgress({
  currentIndex,
  tuned,
  strings,
  onSelect,
}: {
  currentIndex: number;
  /** Tuned strings, by string id. */
  tuned: Record<number, true>;
  strings: GuitarString[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex items-end gap-2 justify-center">
      {strings.map((s, i) => {
        const isDone    = !!tuned[s.id];
        const isCurrent = i === currentIndex;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={isCurrent ? "step" : undefined}
            className="flex flex-col items-center gap-1.5 rounded-lg px-1 py-1 transition-colors hover:bg-white/5"
          >
            <span className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-base",
              isCurrent ? "bg-zinc-700" : isDone ? "bg-emerald-500/15" : "bg-zinc-900/60"
            )}>
              {isDone
                ? <Check size='1em' className="h-3.5 w-3.5 text-emerald-400" />
                : isCurrent
                ? <span className="h-2 w-2 rounded-full bg-zinc-200" />
                : null}
            </span>
            <span className={cn(
              "text-xs font-semibold transition-colors",
              isCurrent ? "text-zinc-100" : isDone ? "text-emerald-400/80" : "text-zinc-500"
            )}>
              {s.name}
            </span>
          </button>
        );
      })}
    </div>
  );
});
