import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { ScaleTreeNodeData } from "../types/scaleTree.types";

export type ScaleTreeRFNode = Node<ScaleTreeNodeData, "scaleTreeNode">;

const FAMILY = {
  pentatonic: { gem: "#f59e0b", glow: "rgba(245,158,11,0.85)" },
  diatonic:   { gem: "#22d3ee", glow: "rgba(34,211,238,0.85)"  },
  mode:       { gem: "#a78bfa", glow: "rgba(167,139,250,0.85)" },
} as const;

type Status = "locked" | "available" | "in_progress" | "completed";
type FamilyKey = keyof typeof FAMILY;

interface DiamondStyle {
  bg: string;
  border: string;
  shadow: string;
  opacity: number;
}

function getDiamondStyle(status: Status, gemGlow: string, isSelected: boolean): DiamondStyle {
  if (isSelected) return {
    bg: "rgba(12,28,40,0.95)",
    border: "rgba(251,191,36,0.95)",
    shadow: "0 0 0 2px rgba(251,191,36,0.35), 0 0 28px rgba(251,191,36,0.55)",
    opacity: 1,
  };
  switch (status) {
    case "locked":      return { bg: "#1a1a20", border: "#44444e", shadow: "none", opacity: 0.65 };
    case "available":   return { bg: "#1e1e28", border: "#5a5a72", shadow: "0 0 3px rgba(90,90,114,0.25)", opacity: 1 };
    case "in_progress": return {
      bg: "#08192a",
      border: "rgba(6,182,212,0.8)",
      shadow: "0 0 14px rgba(6,182,212,0.5), 0 0 4px rgba(6,182,212,0.3)",
      opacity: 1,
    };
    case "completed": return {
      bg: "#061616",
      border: "rgba(34,211,238,0.9)",
      shadow: `0 0 20px ${gemGlow}, 0 0 8px rgba(34,211,238,0.35)`,
      opacity: 1,
    };
  }
}

const HANDLE_STYLE = { opacity: 0, width: 1, height: 1, minWidth: 1, minHeight: 1 };

export function ScaleTreeNodeComponent({ data }: NodeProps<ScaleTreeRFNode>) {
  const { label, subtitle, scaleFamily, status, isSelected } = data;
  const isLocked = status === "locked";

  // Spine nodes (ascending pattern) are the "notable" nodes — larger, more prominent
  const isSpine = data.requiredExercises[0]?.patternType === "ascending";
  const diamondSize   = isSpine ? 44 : 28;
  const containerSize = isSpine ? 64 : 40;

  const fam = FAMILY[(scaleFamily as FamilyKey)] ?? FAMILY.diatonic;
  const ds = getDiamondStyle(status as Status, fam.glow, isSelected as boolean);

  return (
    <div className="flex flex-col items-center select-none" style={{ width: isSpine ? 90 : 60 }}>
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} />

      {/* Square container keeps layout footprint consistent */}
      <div style={{ width: containerSize, height: containerSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          whileHover={!isLocked ? { scale: 1.2 } : {}}
          whileTap={!isLocked ? { scale: 0.9 } : {}}
          style={{
            rotate: 45,
            width: diamondSize,
            height: diamondSize,
            background: ds.bg,
            border: `2px solid ${ds.border}`,
            boxShadow: ds.shadow,
            opacity: ds.opacity,
            cursor: isLocked ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <motion.div
            style={{
              rotate: -45,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {status === "completed" && (
              <div style={{
                width: 16,
                height: 16,
                background: fam.gem,
                transform: "rotate(45deg)",
                boxShadow: `0 0 10px ${fam.glow}, 0 0 4px ${fam.gem}`,
              }} />
            )}
            {status === "in_progress" && (
              <motion.div
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                style={{
                  width: 12,
                  height: 12,
                  background: "rgba(6,182,212,0.85)",
                  transform: "rotate(45deg)",
                  boxShadow: "0 0 8px rgba(6,182,212,0.9)",
                }}
              />
            )}
            {status === "available" && (
              <div style={{
                width: 10,
                height: 10,
                background: "rgba(100,100,130,0.7)",
                transform: "rotate(45deg)",
                boxShadow: "0 0 4px rgba(100,100,150,0.4)",
              }} />
            )}
            {status === "locked" && (
              <Lock size={13} color="rgba(100,100,120,0.7)" />
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Label — only non-locked spine nodes (branch labels would be illegible) */}
      {!isLocked && isSpine && (
        <div style={{ width: 90, marginTop: 1 }} className="text-center">
          <p className="text-[9px] font-bold leading-tight text-zinc-300 truncate px-1">{label as string}</p>
          <p className="text-[8px] leading-tight text-zinc-600 truncate px-1">{subtitle as string}</p>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} />
    </div>
  );
}
