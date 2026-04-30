import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Play, X } from "lucide-react";
import { generateScaleExercise } from "feature/exercisePlan/scales/scaleExerciseGenerator";
import { TablaturePreview } from "feature/exercisePlan/components/CreatePlanDialog/steps/SelectExercisesStep/components/TablaturePreview";
import type { NodeStatus, ScaleTreeNodeDef } from "../types/scaleTree.types";

const PATTERN_LABELS: Record<string, string> = {
  ascending:            "Ascending",
  descending:           "Descending",
  ascending_descending: "Ascending + Descending",
  intervals_thirds:     "Thirds",
  intervals_fourths:    "Fourths",
  sequence_3_notes:     "Sequence 3",
  sequence_4_notes:     "Sequence 4",
};

const FAMILY_LABEL: Record<string, string> = {
  pentatonic: "Pentatonic",
  diatonic:   "Diatonic Scale",
  mode:       "Modal Mode",
};

const FAMILY_COLOR: Record<string, string> = {
  pentatonic: "text-amber-400",
  diatonic:   "text-cyan-400",
  mode:       "text-violet-400",
};

interface ScaleNodeModalProps {
  node: ScaleTreeNodeDef | null;
  status: NodeStatus | null;
  onClose: () => void;
  onPractice: () => void;
}

export function ScaleNodeModal({ node, status, onClose, onPractice }: ScaleNodeModalProps) {
  const req = node?.requiredExercises[0];

  const tablature = useMemo(() => {
    if (!req) return null;
    try {
      const exercise = generateScaleExercise({
        rootNote: "C",
        scaleType: req.scaleType,
        patternType: req.patternType,
        position: req.position,
      });
      return exercise.tablature ?? null;
    } catch {
      return null;
    }
  }, [req]);

  return (
    <AnimatePresence>
      {node && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.16 }}
            className="absolute left-1/2 top-1/2 z-30 w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-zinc-900/95 shadow-2xl backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-4 pb-2">
              <div className="min-w-0">
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${FAMILY_COLOR[node.scaleFamily] ?? "text-zinc-400"}`}>
                  {FAMILY_LABEL[node.scaleFamily] ?? node.scaleFamily}
                </p>
                <h2 className="mt-0.5 text-base font-bold leading-tight text-white">{node.label}</h2>
                <p className="text-xs text-zinc-500">{node.subtitle}</p>
              </div>
              <button
                onClick={onClose}
                className="ml-3 mt-0.5 flex-shrink-0 text-zinc-600 transition-colors hover:text-zinc-300"
              >
                <X size={15} />
              </button>
            </div>

            {/* Exercise tags */}
            {req && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
                  {PATTERN_LABELS[req.patternType] ?? req.patternType}
                </span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
                  Pos. {req.position}
                </span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
                  {req.requiredBpm} BPM
                </span>
              </div>
            )}

            {/* Tablature preview */}
            {tablature && tablature.length > 0 && (
              <div className="mx-4 mb-3 overflow-hidden rounded-lg border border-white/5 bg-zinc-950">
                <TablaturePreview measures={tablature} />
              </div>
            )}

            {/* Action */}
            <div className="p-4 pt-1">
              {status === "locked" ? (
                <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2.5 text-xs text-zinc-500">
                  <Lock size={12} className="flex-shrink-0" />
                  Complete the required exercises to unlock
                </div>
              ) : (
                <button
                  onClick={onPractice}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 active:bg-cyan-700"
                >
                  <Play size={14} />
                  Practice
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
