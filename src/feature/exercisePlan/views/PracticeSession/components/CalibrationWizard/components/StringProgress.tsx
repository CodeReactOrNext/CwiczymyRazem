import { cn } from "assets/lib/utils";
import React from "react";
import { FaCheck } from "react-icons/fa";

import type { CalibrationOffsets } from "../../../hooks/useCalibration";
import { STRINGS } from "../calibration.constants";

export const StringProgress = React.memo(function StringProgress({
  currentIndex,
  offsets,
}: {
  currentIndex: number;
  offsets: CalibrationOffsets;
}) {
  return (
    <div className="flex items-end gap-2 justify-center">
      {STRINGS.map((s, i) => {
        const isDone    = offsets[s.id] !== undefined;
        const isCurrent = i === currentIndex;
        return (
          <div key={s.id} className="flex flex-col items-center gap-1.5">
            <div className={cn(
              "flex items-center justify-center rounded-lg transition-all duration-300",
              isDone    ? "h-7 w-7 bg-emerald-500/15" :
              isCurrent ? "h-8 w-8 bg-cyan-400/10" :
                          "h-6 w-6 bg-zinc-900/60"
            )}>
              {isDone
                ? <FaCheck className="h-2.5 w-2.5 text-emerald-400" />
                : isCurrent
                ? <div className="h-2 w-2 rounded-lg bg-cyan-400 animate-pulse" />
                : null}
            </div>
            <span className={cn(
              "text-[9px] font-bold transition-colors",
              isDone    && "text-emerald-500/60",
              isCurrent && "text-cyan-400",
              !isCurrent && !isDone && "text-zinc-700"
            )}>
              {s.name}
            </span>
          </div>
        );
      })}
    </div>
  );
});
