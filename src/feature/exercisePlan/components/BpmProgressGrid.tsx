import { cn } from "assets/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";

interface BpmProgressGridProps {
  bpmStages: number[];
  completedBpms: number[];
  recommendedBpm: number;
  onToggle: (bpm: number) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

export const BpmProgressGrid = ({
  bpmStages,
  completedBpms,
  recommendedBpm,
  onToggle,
  isLoading = false,
  readOnly = false,
}: BpmProgressGridProps) => {
  if (bpmStages.length === 0) return null;

  const completedCount = completedBpms.length;
  const totalCount = bpmStages.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          BPM Progress
        </span>
        <span className="text-[10px] font-bold text-white">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {bpmStages.map((bpm) => {
          const isCompleted = completedBpms.includes(bpm);
          const isRecommended = bpm === recommendedBpm;

          return (
            <button
              key={bpm}
              onClick={() => !readOnly && !isLoading && onToggle(bpm)}
              disabled={readOnly || isLoading}
              className={cn(
                "relative group flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-mono font-bold transition-all select-none",
                "border min-w-[44px]",
                isCompleted
                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600/40"
                  : "border-white/5 bg-zinc-900/60 text-zinc-300",
                isRecommended &&
                  !isCompleted &&
                  "border-cyan-500/30 bg-cyan-500/5 text-cyan-300",
                !readOnly &&
                  !isLoading &&
                  !isCompleted &&
                  "hover:bg-zinc-800/80 hover:border-white/10 hover:text-white cursor-pointer",
                !readOnly &&
                  !isLoading &&
                  isCompleted &&
                  "hover:border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer",
                (readOnly || isLoading) && "cursor-default"
              )}
            >
              {/* BPM number — with strikethrough when completed */}
              <span
                className={cn(
                  "relative transition-all duration-200",
                  isCompleted && "line-through decoration-emerald-500/60 decoration-2"
                )}
              >
                {bpm}
              </span>

              {/* Check icon on completed */}
              <AnimatePresence>
                {isCompleted && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  >
                    <FaCheck className="h-1.5 w-1.5" />
                  </motion.span>
                )}
              </AnimatePresence>

              {/* REC label for recommended */}
              {isRecommended && !isCompleted && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[6px] font-bold uppercase tracking-wider text-cyan-400 bg-zinc-950 px-1 rounded">
                  rec
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
