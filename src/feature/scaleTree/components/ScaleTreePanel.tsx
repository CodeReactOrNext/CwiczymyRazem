import { cn } from "assets/lib/utils";
import { BpmProgressGrid } from "feature/exercisePlan/components/BpmProgressGrid";
import { generateBpmStages } from "feature/exercisePlan/utils/generateBpmStages";
import { toggleBpmStage } from "feature/exercisePlan/services/bpmProgressService";
import { selectUserAuth } from "feature/user/store/userSlice";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Lock, Music, Timer, X } from "lucide-react";
import Link from "next/link";
import { useAppSelector } from "store/hooks";
import type { BpmProgressMap, NodeStatus, RequiredExercise, ScaleTreeNodeDef } from "../types/scaleTree.types";

interface ScaleTreePanelProps {
  node: ScaleTreeNodeDef;
  status: NodeStatus;
  progressMap: BpmProgressMap;
  onClose: () => void;
  onProgressChange: (exerciseId: string, bpms: number[]) => void;
}

// Default metronome range for all generated scale exercises (8th notes, default config)
const DEFAULT_METRO = { min: 70, max: 140, recommended: 100 };

const STATUS_LABELS: Record<NodeStatus, { text: string; color: string }> = {
  locked:      { text: "Locked",       color: "text-zinc-500"   },
  available:   { text: "Available",    color: "text-zinc-300"   },
  in_progress: { text: "In Progress",  color: "text-cyan-400"   },
  completed:   { text: "Completed",    color: "text-emerald-400"},
};

const FAMILY_LABELS = {
  pentatonic: "Pentatonic",
  diatonic:   "Diatonic Scale",
  mode:       "Modal Mode",
} as const;

function ExerciseRow({
  req,
  completedBpms,
  userId,
  onProgressChange,
}: {
  req: RequiredExercise;
  completedBpms: number[];
  userId: string | null;
  onProgressChange: (exerciseId: string, bpms: number[]) => void;
}) {
  const bpmStages = generateBpmStages(DEFAULT_METRO);
  const isThresholdMet = completedBpms.some((b) => b >= req.requiredBpm);

  const handleToggle = async (bpm: number) => {
    if (!userId) return;
    const updated = await toggleBpmStage(
      userId,
      req.exerciseId,
      bpm,
      req.label,
      "theory"
    );
    onProgressChange(req.exerciseId, updated);
  };

  return (
    <div className={cn(
      "rounded-lg border p-3 transition-colors",
      isThresholdMet
        ? "border-emerald-500/20 bg-emerald-950/20"
        : "border-white/5 bg-zinc-900/40",
    )}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-300">{req.label}</span>
        <div className="flex items-center gap-1.5">
          {isThresholdMet && (
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
          )}
          <span className="text-[10px] text-zinc-500">
            goal: {req.requiredBpm} BPM
          </span>
        </div>
      </div>

      <BpmProgressGrid
        bpmStages={bpmStages}
        completedBpms={completedBpms}
        recommendedBpm={req.requiredBpm}
        onToggle={handleToggle}
      />
    </div>
  );
}

export function ScaleTreePanel({
  node,
  status,
  progressMap,
  onClose,
  onProgressChange,
}: ScaleTreePanelProps) {
  const userId = useAppSelector(selectUserAuth);
  const statusLabel = STATUS_LABELS[status];
  const completedCount = node.requiredExercises.filter((req) => {
    const bpms = progressMap.get(req.exerciseId) ?? [];
    return bpms.some((b) => b >= req.requiredBpm);
  }).length;

  return (
    <AnimatePresence>
      <motion.aside
        key="panel"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="absolute right-0 top-0 z-10 flex h-full w-80 flex-col border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 p-4">
          <div className="flex-1 min-w-0">
            <div className="mb-0.5 flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {FAMILY_LABELS[node.scaleFamily]}
              </span>
            </div>
            <h2 className="text-base font-bold text-white leading-tight truncate">
              {node.label}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">{node.subtitle}</p>
          </div>

          <button
            onClick={onClose}
            className="ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2">
          {status === "locked" ? (
            <Lock className="h-3.5 w-3.5 text-zinc-500" />
          ) : (
            <Music className="h-3.5 w-3.5 text-cyan-500" />
          )}
          <span className={cn("text-xs font-medium", statusLabel.color)}>
            {statusLabel.text}
          </span>
          {status !== "locked" && (
            <span className="ml-auto text-xs text-zinc-500">
              {completedCount}/{node.requiredExercises.length}
            </span>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent">
          {/* Description */}
          <p className="text-xs leading-relaxed text-zinc-400">{node.description}</p>

          {status === "locked" ? (
            <div className="rounded-lg border border-white/5 bg-zinc-900/40 p-3 text-xs text-zinc-500">
              Complete the previous nodes to unlock this scale.
            </div>
          ) : (
            <>
              {/* Required exercises */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Required exercises
                </p>
                <div className="space-y-2">
                  {node.requiredExercises.map((req) => (
                    <ExerciseRow
                      key={req.exerciseId}
                      req={req}
                      completedBpms={progressMap.get(req.exerciseId) ?? []}
                      userId={userId}
                      onProgressChange={onProgressChange}
                    />
                  ))}
                </div>
              </div>

              {/* Practice link */}
              <Link
                href="/timer"
                className="flex items-center justify-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-2.5 text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/10 hover:text-cyan-300"
              >
                <Timer className="h-4 w-4" />
                Practice in the Timer section
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>

              <p className="text-[10px] text-zinc-600 leading-relaxed">
                Go to the Timer section → select "Scale Practice (Configurable)" → set{" "}
                <span className="text-zinc-400">{node.label}</span> in the key of C.
                After practicing, mark the achieved BPM in the grid above.
              </p>
            </>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
