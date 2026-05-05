import { useRef, useState } from "react";
import { Lock, Guitar, Music2, Music } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { ScaleTreeNodeData, NodeStatus } from "../types/scaleTree.types";

export type ScaleTreeRFNode = Node<ScaleTreeNodeData, "scaleTreeNode">;

const FAMILY = {
  pentatonic: { gem: "#f59e0b", glow: "rgba(245,158,11,0.85)", Icon: Guitar  },
  diatonic:   { gem: "#22d3ee", glow: "rgba(34,211,238,0.85)", Icon: Music2  },
  mode:       { gem: "#a78bfa", glow: "rgba(167,139,250,0.85)", Icon: Music  },
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

interface CircleStyle {
  bg: string;
  border: string;
  shadow: string;
  opacity: number;
}

function getCircleStyle(status: NodeStatus, gemGlow: string, selected: boolean): CircleStyle {
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

  const FAMILY_LABEL: Record<FamilyKey, string> = {
    pentatonic: "Pentatonic",
    diatonic:   "Diatonic Scale",
    mode:       "Modal Mode",
  };

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

      <div style={{ fontWeight: 700, fontSize: 12, color: "#f4f4f5", letterSpacing: "0.01em", marginBottom: 2 }}>
        {label as string}
      </div>
      <div style={{ fontSize: 10, color: "#a1a1aa", marginBottom: 2 }}>
        {subtitle as string}
      </div>
      <div style={{ fontSize: 9, color: famGem, opacity: 0.8, marginBottom: 8 }}>
        {FAMILY_LABEL[scaleFamily as FamilyKey]}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: "#52525b" }}>Status</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: STATUS_COLOR[status as NodeStatus] }}>
          {STATUS_LABEL[status as NodeStatus]}
        </span>
      </div>

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
  const isDimmed = data.dimmed as boolean | undefined;
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
  const isSingleString = data.requiredExercises[0]?.stringNum != null || (data.requiredExercises[0]?.patternType as any) === "single_string";

  const circleSize   = isSpine ? 52 : 34;
  const containerSize = isSpine ? 72 : 52;
  const nodeWidth     = isSpine ? 92 : 64;

  const nodeRadius = isSingleString ? "8px" : "50%";
  const nodeTransform = isSingleString ? "rotate(45deg)" : "none";
  const contentTransform = isSingleString ? "rotate(-45deg)" : "none";

  const fam = FAMILY[(scaleFamily as FamilyKey)] ?? FAMILY.diatonic;
  const cs = getCircleStyle(status as NodeStatus, fam.glow, selected ?? false);
  const FamIcon = fam.Icon;

  const iconColor = selected
    ? "#fbbf24"
    : status === "completed"
    ? fam.gem
    : status === "in_progress"
    ? "#22d3ee"
    : status === "available"
    ? "rgba(160,160,200,0.65)"
    : "rgba(70,70,90,0.5)";

  const iconSize = isSpine ? 20 : 13;
  const isActive = status === "completed" || status === "in_progress";

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{ width: nodeWidth, position: "relative", opacity: isDimmed ? 0.12 : 1, transition: "opacity 0.25s" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Handle type="target" position={Position.Top} id="t_top" style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Top} id="s_top" style={HANDLE_STYLE} />

      {showTooltip && <NodeTooltip data={data} famGem={fam.gem} />}

      {/* Spine marker dot */}
      {isSpine && (
        <div style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: fam.gem,
          boxShadow: `0 0 6px ${fam.glow}`,
          marginBottom: 4,
          opacity: isLocked ? 0.3 : 0.7,
        }} />
      )}

      <div style={{ width: containerSize, height: containerSize, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {/* Main shape container for scaling */}
        <div
          className={`relative flex items-center justify-center ${isLocked ? "" : "hover:scale-110 active:scale-90"}`}
          style={{
            width: circleSize,
            height: circleSize,
            cursor: isLocked ? "not-allowed" : "pointer",
            transition: "transform 0.12s",
            flexShrink: 0,
          }}
        >
          {/* Outer glow ring */}
          {(isActive || selected) && (
            <div style={{
              position: "absolute",
              width: circleSize + 14,
              height: circleSize + 14,
              borderRadius: nodeRadius,
              transform: nodeTransform,
              border: `1px solid ${selected ? "rgba(251,191,36,0.45)" : cs.border}`,
              opacity: 0.4,
              pointerEvents: "none",
            }} />
          )}

          {/* Second ring for completed */}
          {status === "completed" && (
            <div style={{
              position: "absolute",
              width: circleSize + 26,
              height: circleSize + 26,
              borderRadius: nodeRadius,
              transform: nodeTransform,
              border: `1px solid ${cs.border}`,
              opacity: 0.15,
              pointerEvents: "none",
            }} />
          )}

          {/* Actual shape background */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              background: cs.bg,
              border: `2px solid ${cs.border}`,
              boxShadow: cs.shadow,
              opacity: cs.opacity,
              borderRadius: nodeRadius,
              transform: nodeTransform,
              transition: "box-shadow 0.12s",
            }}
          />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, transform: contentTransform, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isLocked ? (
              <>
                <FamIcon size={iconSize} color="rgba(90,90,110,0.3)" />
                <div style={{ position: "absolute", bottom: -2, right: -4, background: "#101018", borderRadius: "50%", padding: 2, border: "1px solid #2a2a3a" }}>
                  <Lock size={8} color="#666" />
                </div>
              </>
            ) : (
              <FamIcon
                size={iconSize}
                color={iconColor}
                style={status !== "available" ? { filter: `drop-shadow(0 0 5px ${iconColor})` } : undefined}
              />
            )}
          </div>
        </div>
      </div>

      {/* Labels */}
      <div style={{ width: nodeWidth, marginTop: 3 }} className="text-center">
        {isSpine ? (
          <>
            <p className={`text-[9px] font-medium tracking-wide leading-tight truncate px-1 ${isLocked ? "text-zinc-500" : "text-zinc-200"}`}>
              {label as string}
            </p>
            <p className={`text-[8px] font-light leading-tight tracking-wide truncate px-1 ${isLocked ? "text-zinc-600" : "text-zinc-500"}`}>
              {subtitle as string}
            </p>
          </>
        ) : (
          <p className={`text-[7px] font-light tracking-wide leading-tight truncate px-1 ${isLocked ? "text-zinc-600" : "text-zinc-500"}`}>
            {subtitle as string}
          </p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} id="s_bottom" style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Bottom} id="t_bottom" style={HANDLE_STYLE} />
    </div>
  );
}
