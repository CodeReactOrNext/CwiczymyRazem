import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { ScaleTreeNodeData } from "../types/scaleTree.types";

export type ScaleTreeRFNode = Node<ScaleTreeNodeData, "scaleTreeNode">;

const FAMILY_COLORS = {
  pentatonic: { dot: "bg-amber-400" },
  diatonic:   { dot: "bg-cyan-400"  },
  mode:       { dot: "bg-violet-400"},
} as const;

const STATUS_STYLES = {
  locked: {
    card: "opacity-40 grayscale cursor-not-allowed border-white/5 bg-zinc-900/60",
    glow: "",
  },
  available: {
    card: "cursor-pointer border-white/10 bg-zinc-900/80 hover:border-cyan-500/30 hover:bg-zinc-800/80 transition-colors duration-200",
    glow: "",
  },
  in_progress: {
    card: "cursor-pointer border-cyan-500/40 bg-zinc-900/90 hover:border-cyan-400/60",
    glow: "ring-1 ring-cyan-500/20",
  },
  completed: {
    card: "cursor-pointer border-cyan-400/60 bg-cyan-950/30",
    glow: "ring-2 ring-cyan-400/40 shadow-[0_0_24px_rgba(34,211,238,0.25)]",
  },
} as const;

export function ScaleTreeNodeComponent({ data }: NodeProps<ScaleTreeRFNode>) {
  const { label, subtitle, scaleFamily, status, progress, isSelected, onSelect } = data;

  const familyColor = FAMILY_COLORS[scaleFamily as keyof typeof FAMILY_COLORS] ?? FAMILY_COLORS.diatonic;
  const statusStyle = STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.available;
  const isLocked = status === "locked";

  return (
    <>
      <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />

      <motion.div
        whileHover={isLocked ? {} : { scale: 1.03 }}
        whileTap={isLocked ? {} : { scale: 0.98 }}
        className={cn(
          "relative w-[190px] rounded-xl border px-4 py-3 select-none",
          statusStyle.card,
          statusStyle.glow,
          isSelected && !isLocked && "border-cyan-400/80 ring-2 ring-cyan-400/50 bg-cyan-950/40",
        )}
      >
        {/* Status icon */}
        <div className="absolute top-2.5 right-2.5">
          {status === "completed" ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]">
              <Check className="h-3 w-3 text-zinc-950" strokeWidth={3} />
            </div>
          ) : status === "locked" ? (
            <Lock className="h-3.5 w-3.5 text-zinc-600" />
          ) : null}
        </div>

        {/* Family color dot + subtitle */}
        <div className="mb-1 flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", familyColor.dot)} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {subtitle as string}
          </span>
        </div>

        {/* Scale name */}
        <p className={cn(
          "text-sm font-bold leading-tight",
          isLocked ? "text-zinc-500" : "text-white",
        )}>
          {label as string}
        </p>

        {/* Progress bar */}
        {!isLocked && (() => {
          const prog = progress as { done: number; total: number };
          return (
            <div className="mt-2.5 space-y-1">
              <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(prog.done / prog.total) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    status === "completed" ? "bg-cyan-400" : "bg-cyan-600",
                  )}
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                {prog.done}/{prog.total} ćwiczeń
              </p>
            </div>
          );
        })()}

        {/* In-progress pulse ring */}
        {status === "in_progress" && (
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="pointer-events-none absolute inset-0 rounded-xl border border-cyan-400/30"
          />
        )}
      </motion.div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
}
