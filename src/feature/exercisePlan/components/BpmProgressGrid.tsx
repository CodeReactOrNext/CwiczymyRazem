import { PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { CheckIcon } from "lucide-react";

interface BpmProgressGridProps {
  bpmStages: number[];
  completedBpms: number[];
  recommendedBpm: number;
  onToggle: (bpm: number) => void;
  isLoading?: boolean;
  readOnly?: boolean;
  /** Skip the title + count row, e.g. when a dialog already shows its own. */
  hideHeader?: boolean;
}

export const BpmProgressGrid = ({
  bpmStages,
  completedBpms,
  recommendedBpm,
  onToggle,
  isLoading = false,
  readOnly = false,
  hideHeader = false,
}: BpmProgressGridProps) => {
  const { t } = useTranslation("plans");
  if (bpmStages.length === 0) return null;

  const completedCount = completedBpms.length;
  const totalCount = bpmStages.length;
  const isInteractive = !readOnly && !isLoading;

  return (
    <div className="space-y-3">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400">
            {t("bpm_progress")}
          </span>
          <span className="font-mono text-xs font-bold tabular-nums text-zinc-300">
            {completedCount}/{totalCount}
          </span>
        </div>
      )}

      {/* Equal columns instead of flex-wrap, so a short last row lines up with the rest. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2">
        {bpmStages.map((bpm) => {
          const isCompleted = completedBpms.includes(bpm);
          const isRecommended = bpm === recommendedBpm;

          return (
            <button
              key={bpm}
              type="button"
              aria-pressed={isCompleted}
              onClick={() => isInteractive && onToggle(bpm)}
              disabled={!isInteractive}
              className={cn(
                PRESSABLE_KEY,
                "flex h-10 select-none items-center justify-center gap-1 rounded-lg font-mono text-sm font-bold tabular-nums transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                isCompleted
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-zinc-800/60 text-zinc-300",
                isRecommended && !isCompleted && "text-cyan-400",
                isInteractive &&
                  (isCompleted
                    ? "hover:bg-emerald-500/20"
                    : "hover:bg-zinc-700/60 hover:text-white"),
                !isInteractive && "cursor-default"
              )}
            >
              {isCompleted && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
              {bpm}
            </button>
          );
        })}
      </div>
    </div>
  );
};
