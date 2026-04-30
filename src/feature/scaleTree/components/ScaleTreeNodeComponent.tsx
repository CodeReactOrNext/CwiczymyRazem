import { useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { ScaleTreeNodeData, NodeStatus } from "../types/scaleTree.types";

export type ScaleTreeRFNode = Node<ScaleTreeNodeData, "scaleTreeNode">;

const FAMILY = {
  pentatonic: { gem: "#f59e0b", glow: "rgba(245,158,11,0.85)" },
  diatonic:   { gem: "#22d3ee", glow: "rgba(34,211,238,0.85)"  },
  mode:       { gem: "#a78bfa", glow: "rgba(167,139,250,0.85)" },
} as const;

type FamilyKey = keyof typeof FAMILY;

const STATUS_LABEL: Record<NodeStatus, string> = {
  locked:      "Locked",
  available:   "Available",
  in_progress: "In Progress",
  completed:   "Completed",
};

const STATUS_COLOR: Record<NodeStatus, string> = {
  locked:      "#52525b",
  available:   "#a1a1aa",
  in_progress: "#22d3ee",
  completed:   "#10b981",
};

const FAMILY_LABEL: Record<FamilyKey, string> = {
  pentatonic: "Pentatonic",
  diatonic:   "Diatonic Scale",
  mode:       "Modal Mode",
};

interface DiamondStyle {
  bg: string;
  border: string;
  shadow: string;
  opacity: number;
}

function getDiamondStyle(status: NodeStatus, gemGlow: string, selected: boolean): DiamondStyle {
  if (selected) return {
    bg: "#16201a",
    border: "rgba(251,191,36,1)",
    shadow: "0 0 0 2px rgba(251,191,36,0.50), 0 0 44px rgba(251,191,36,0.80), 0 0 18px rgba(251,191,36,0.45), inset 0 0 20px rgba(251,191,36,0.10)",
    opacity: 1,
  };
  switch (status) {
    case "locked":      return { bg: "#18182a", border: "#484860", shadow: "none", opacity: 0.55 };
    case "available":   return { bg: "#1e1e32", border: "rgba(150,150,200,0.80)", shadow: "0 0 6px rgba(100,100,160,0.20)", opacity: 1 };
    case "in_progress": return {
      bg: "#0d2038",
      border: "rgba(6,182,212,1)",
      shadow: "0 0 24px rgba(6,182,212,0.70), 0 0 10px rgba(6,182,212,0.40), inset 0 0 14px rgba(6,182,212,0.12)",
      opacity: 1,
    };
    case "completed": return {
      bg: "#0a1e1e",
      border: "rgba(34,211,238,1)",
      shadow: `0 0 32px ${gemGlow}, 0 0 14px rgba(34,211,238,0.55), inset 0 0 16px rgba(34,211,238,0.12)`,
      opacity: 1,
    };
  }
}

function NodeTooltip({ data, famGem }: { data: ScaleTreeNodeData; famGem: string }) {
  const { label, subtitle, status, requiredExercises, currentBpm, prerequisites, scaleFamily } = data;
  const req = requiredExercises[0];
  const requiredBpm = req?.requiredBpm ?? 0;
  const bpmRatio = requiredBpm > 0 ? Math.min(1, (currentBpm ?? 0) / requiredBpm) : 0;
  const bpmColor = bpmRatio >= 1 ? "#22d3ee" : bpmRatio >= 0.6 ? "#f59e0b" : "#52525b";
  const prereqCount = (prerequisites as string[]).length;

  return (
    <div style={{
      position: "absolute",
      bottom: "calc(100% + 10px)",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      pointerEvents: "none",
      background: "rgba(8,8,18,0.97)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10,
      padding: "10px 13px 10px",
      backdropFilter: "blur(16px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
      width: 230,
      whiteSpace: "nowrap",
    }}>
      {/* Arrow */}
      <div style={{
        position: "absolute",
        bottom: -5,
        left: "50%",
        transform: "translateX(-50%) rotate(45deg)",
        width: 9,
        height: 9,
        background: "rgba(8,8,18,0.97)",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
      }} />

      {/* Header */}
      <div style={{ fontWeight: 700, fontSize: 12, color: "#f4f4f5", letterSpacing: "0.01em", marginBottom: 2 }}>
        {label as string}
      </div>
      <div style={{ fontSize: 10, color: "#a1a1aa", marginBottom: 2 }}>
        {subtitle as string}
      </div>
      <div style={{ fontSize: 9, color: famGem, opacity: 0.8, marginBottom: 8 }}>
        {FAMILY_LABEL[scaleFamily as FamilyKey]}
      </div>

      {/* Status row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: "#52525b" }}>Status</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: STATUS_COLOR[status as NodeStatus] }}>
          {STATUS_LABEL[status as NodeStatus]}
        </span>
      </div>

      {/* BPM section */}
      {req && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: "#52525b" }}>Required BPM</span>
            <span style={{ fontSize: 10, color: "#e4e4e7" }}>{requiredBpm} BPM</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#52525b" }}>Your best</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: bpmColor }}>
              {currentBpm != null ? `${currentBpm} BPM` : "—"}
            </span>
          </div>
          {/* BPM bar */}
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
            <div style={{
              height: "100%",
              width: `${bpmRatio * 100}%`,
              background: bpmColor,
              borderRadius: 2,
              boxShadow: bpmRatio >= 1 ? `0 0 8px ${bpmColor}` : "none",
            }} />
          </div>
          {bpmRatio > 0 && bpmRatio < 1 && (
            <div style={{ fontSize: 9, color: "#52525b", marginTop: 3, textAlign: "right" }}>
              {Math.round(bpmRatio * 100)}% of goal
            </div>
          )}
          {bpmRatio >= 1 && (
            <div style={{ fontSize: 9, color: "#22d3ee", marginTop: 3, textAlign: "right" }}>
              Goal achieved
            </div>
          )}
        </div>
      )}

      {/* Prerequisites */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 7 }}>
        <span style={{ fontSize: 9, color: "#52525b" }}>
          {prereqCount === 0
            ? "Start node — no requirements"
            : prereqCount === 1
            ? "Requires 1 previous node"
            : `Requires ${prereqCount} previous nodes`}
        </span>
      </div>
    </div>
  );
}

const HANDLE_STYLE = { opacity: 0, width: 1, height: 1, minWidth: 1, minHeight: 1 };

export function ScaleTreeNodeComponent({ data, selected }: NodeProps<ScaleTreeRFNode>) {
  const { label, subtitle, scaleFamily, status } = data;
  const isLocked = status === "locked";
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setShowTooltip(true), 280);
  };
  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setShowTooltip(false);
  };

  const isSpine = data.requiredExercises[0]?.patternType === "ascending";
  const diamondSize   = isSpine ? 50 : 30;
  const containerSize = isSpine ? 70 : 44;

  const fam = FAMILY[(scaleFamily as FamilyKey)] ?? FAMILY.diatonic;
  const ds = getDiamondStyle(status as NodeStatus, fam.glow, selected ?? false);

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{ width: isSpine ? 90 : 60, position: "relative" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} />

      {showTooltip && <NodeTooltip data={data} famGem={fam.gem} />}

      <div style={{ width: containerSize, height: containerSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
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
            transition: "transform 0.12s, box-shadow 0.12s",
          }}
          className={isLocked ? "" : "hover:scale-110 active:scale-90"}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {status === "completed" && (
              <div style={{
                width: isSpine ? 20 : 14,
                height: isSpine ? 20 : 14,
                background: fam.gem,
                boxShadow: `0 0 16px ${fam.glow}, 0 0 6px ${fam.gem}, 0 0 28px ${fam.glow}`,
              }} />
            )}
            {status === "in_progress" && (
              <div
                style={{
                  width: isSpine ? 14 : 10,
                  height: isSpine ? 14 : 10,
                  background: "rgba(6,182,212,0.90)",
                  boxShadow: "0 0 14px rgba(6,182,212,0.95), 0 0 6px rgba(6,182,212,0.6)",
                  animation: "pulse 1.8s ease-in-out infinite",
                }}
              />
            )}
            {status === "available" && (
              <div style={{
                width: isSpine ? 10 : 7,
                height: isSpine ? 10 : 7,
                background: "rgba(80,80,110,0.65)",
                boxShadow: "0 0 4px rgba(80,80,120,0.35)",
              }} />
            )}
            {status === "locked" && (
              <Lock size={isSpine ? 14 : 10} color="rgba(70,70,90,0.55)" />
            )}
          </div>
        </div>
      </div>

      {isSpine && (
        <div style={{ width: 90, marginTop: 2 }} className="text-center">
          <p className={`text-[9px] font-light tracking-wide leading-tight truncate px-1 ${isLocked ? "text-zinc-500" : "text-zinc-100"}`}>{label as string}</p>
          <p className={`text-[8px] font-light leading-tight tracking-wide truncate px-1 ${isLocked ? "text-zinc-600" : "text-zinc-500"}`}>{subtitle as string}</p>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} />
    </div>
  );
}
