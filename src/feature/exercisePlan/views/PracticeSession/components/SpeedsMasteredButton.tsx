import { cn } from "assets/lib/utils";
import { X } from "lucide-react";
import { memo, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheck } from "react-icons/fa";

import { BpmProgressGrid } from "../../../components/BpmProgressGrid";
import type { Exercise } from "../../../types/exercise.types";
import { useBpmProgressContext } from "../contexts/BpmProgressContext";

interface SpeedsMasteredButtonProps {
  exercise: Exercise;
  examMode?: boolean;
  compact?: boolean;
}

export const SpeedsMasteredButton = memo(function SpeedsMasteredButton({
  exercise,
  examMode = false,
  compact = false,
}: SpeedsMasteredButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { bpmStages, completedBpms, isBpmLoading, onBpmToggle } = useBpmProgressContext();

  const hasBpmProgress =
    !!exercise.metronomeSpeed && bpmStages.length > 0 && !exercise.gpFileUrl && !examMode;

  if (!hasBpmProgress) return null;

  const h = compact ? "h-8" : "h-12";

  return (
    <>
      {!compact && <div className="h-7 w-px bg-white/10 self-center" aria-hidden />}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-lg font-bold transition-all active:scale-95",
          h,
          compact ? "px-2" : "px-4",
          isOpen
            ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
            : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
        )}
        title="Speeds you've mastered for this exercise"
      >
        <FaCheck className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
        {!compact && <span className="text-[10px] font-semibold tracking-wide">Speeds mastered</span>}
        <span
          className={cn(
            "rounded bg-zinc-900 font-mono",
            compact ? "px-1 text-[10px]" : "px-1.5 py-0.5 text-xs",
            completedBpms.length > 0 ? "text-emerald-400" : "text-zinc-500"
          )}
        >
          {completedBpms.length}/{bpmStages.length}
        </span>
      </button>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative mx-4 w-full max-w-xl rounded-lg border border-white/10 bg-zinc-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 z-10 text-zinc-500 transition-colors hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="p-6">
              <BpmProgressGrid
                bpmStages={bpmStages}
                completedBpms={completedBpms}
                recommendedBpm={exercise.metronomeSpeed!.recommended}
                onToggle={onBpmToggle}
                isLoading={isBpmLoading}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
});
