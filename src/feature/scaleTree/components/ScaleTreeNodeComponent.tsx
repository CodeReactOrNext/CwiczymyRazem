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

const SHAPE_CLIP: Record<string, string> = {
  // Regular pentagon — pentatonic has 5 positions
  pentatonic:    "polygon(50% 0%, 93.3% 25%, 76.6% 80.9%, 23.4% 80.9%, 6.7% 25%)",
  // Octagon — professional, classical mastery
  diatonic:      "polygon(38.2% 0%, 61.8% 0%, 100% 38.2%, 100% 61.8%, 61.8% 100%, 38.2% 100%, 0% 61.8%, 0% 38.2%)",
  // Hexagon — clean and solid
  mode:          "polygon(50% 0%, 86.6% 25%, 86.6% 75%, 50% 100%, 13.4% 75%, 13.4% 25%)",
  // Plain diamond — gateway single-string nodes
  single_string: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
};

const STATUS_LABEL: Record<NodeStatus, string> = {
  locked:      "Locked",
  available:   "Available",
  in_progress: "In Progress",
  completed:   "Completed",
};

const STATUS_COLOR: Record<NodeStatus, string> = {
  locked:      "#6b7280",
  available:   "#64b5f6",
  in_progress: "#00e5ff",
  completed:   "#00ff88",
};

function toRoman(num: number): string {
  const map: Record<number, string> = { 
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 
    6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X" 
  };
  return map[num] || num.toString();
}

interface CircleStyle {
  bg: string;
  border: string;
  shadow: string;
  opacity: number;
}

function getCircleStyle(status: NodeStatus, selected: boolean): CircleStyle {
  if (selected) return {
    bg: "#451a03",
    border: "#fbbf24",
    shadow: "drop-shadow(0 0 10px rgba(251,191,36,0.8))",
    opacity: 1,
  };
  switch (status) {
    case "locked":      return { 
      bg: "#1e293b", 
      border: "#334155", 
      shadow: "none", opacity: 0.9 
    };
    case "available":   return { 
      bg: "#1e3a8a", 
      border: "#3b82f6", 
      shadow: "drop-shadow(0 0 8px rgba(59,130,246,0.6))", opacity: 1 
    };
    case "in_progress": return {
      bg: "#083344",
      border: "#06b6d4",
      shadow: "drop-shadow(0 0 10px rgba(6,182,212,0.8))",
      opacity: 1,
    };
    case "completed": return {
      bg: "#022c22",
      border: "#10b981",
      shadow: "drop-shadow(0 0 10px rgba(16,185,129,0.7))",
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
      bottom: "calc(100% + 14px)",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      pointerEvents: "none",
      background: "linear-gradient(to bottom, rgba(28,25,23,0.95), rgba(12,10,9,0.95))",
      border: "1px solid #44403c",
      borderTop: "1px solid #78716c",
      borderRadius: 6,
      padding: "12px 16px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)",
      width: 240,
      whiteSpace: "nowrap",
    }}>
      <div style={{
        position: "absolute",
        bottom: -6,
        left: "50%",
        transform: "translateX(-50%) rotate(45deg)",
        width: 10,
        height: 10,
        background: "#0c0a09",
        borderRight: "1px solid #44403c",
        borderBottom: "1px solid #44403c",
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

const HANDLE_STYLE = { 
  opacity: 0,
  width: 4, 
  height: 4, 
  zIndex: 10,
};

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

  const circleSize   = isSpine ? 64 : 44;
  const containerSize = isSpine ? 84 : 64;
  const nodeWidth     = isSpine ? 110 : 80;

  const fam = FAMILY[(scaleFamily as FamilyKey)] ?? FAMILY.diatonic;
  const cs = getCircleStyle(status as NodeStatus, selected ?? false);
  const FamIcon = fam.Icon;

  const cRGB_map: Record<string, string> = {
    pentatonic: "245,158,11",
    diatonic:   "34,211,238",
    mode:       "167,139,250",
  };
  const cRGB = cRGB_map[scaleFamily as string] ?? cRGB_map.diatonic;
  const shapePath = isSingleString
    ? SHAPE_CLIP.single_string
    : (SHAPE_CLIP[scaleFamily as string] ?? SHAPE_CLIP.diatonic);

  const iconColor = selected
    ? "#fef3c7"
    : status === "completed"
    ? "#ecfdf5"
    : status === "in_progress"
    ? "#cffafe"
    : status === "available"
    ? "#e0e7ff"
    : "#94a3b8";

  const iconSize = isSpine ? 24 : 16;
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
      <Handle type="target" position={Position.Left} id="t_left" style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Left} id="s_left" style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Right} id="t_right" style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Right} id="s_right" style={HANDLE_STYLE} />

      {showTooltip && <NodeTooltip data={data} famGem={fam.gem} />}

      {/* Spine marker dot */}
      {isSpine && (
        <div style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: fam.gem,
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
            filter: cs.shadow !== "none" ? cs.shadow : undefined,
          }}
        >
          {/* Border layer (slightly larger, solid border color) */}
          <div style={{
            position: "absolute",
            width: circleSize,
            height: circleSize,
            background: cs.border,
            clipPath: shapePath,
            opacity: cs.opacity,
            pointerEvents: "none",
          }} />

          {/* Fill layer (slightly smaller to reveal border) */}
          <div style={{
            position: "absolute",
            width: circleSize - 4,
            height: circleSize - 4,
            background: cs.bg,
            clipPath: shapePath,
            opacity: cs.opacity,
            pointerEvents: "none",
          }} />

          {/* Spine inner accent */}
          {isSpine && !isLocked && (
            <div style={{
              position: "absolute",
              width: circleSize - 6,
              height: circleSize - 6,
              background: `rgba(${cRGB}, 0.2)`,
              clipPath: shapePath,
              pointerEvents: "none",
            }} />
          )}

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isSingleString ? (
              isLocked ? (
                <>
                  <FamIcon size={iconSize} color="#94a3b8" />
                  <div style={{ position: "absolute", bottom: -4, right: -6, background: "#1e293b", borderRadius: "50%", padding: 2, border: "2px solid #0f172a" }}>
                    <Lock size={10} color="#cbd5e1" />
                  </div>
                </>
              ) : (
                <FamIcon size={iconSize} color={iconColor} />
              )
            ) : (
              <span style={{ 
                color: iconColor, 
                fontSize: isSpine ? 18 : 14, 
                fontWeight: 700, 
                fontFamily: "'Cinzel', 'Playfair Display', 'Times New Roman', serif",
                lineHeight: 1,
                marginTop: 1,
                letterSpacing: "0.05em"
              }}>
                {toRoman(data.requiredExercises[0]?.position || 1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Labels */}
      <div style={{ width: nodeWidth, marginTop: 4 }} className="text-center">
        {isSpine ? (
          <>
            <p className={`text-[12px] font-bold tracking-wide leading-tight truncate px-1 ${isLocked ? "text-slate-400" : "text-white"}`}>
              {label as string}
            </p>
            <p className={`text-[10px] font-medium leading-tight tracking-wider truncate px-1 mt-0.5 ${isLocked ? "text-slate-500" : "text-slate-300"}`}>
              {subtitle as string}
            </p>
          </>
        ) : (
          <p className={`text-[10px] font-medium leading-tight tracking-wider truncate px-1 ${isLocked ? "text-slate-500" : "text-slate-300"}`}>
            {subtitle as string}
          </p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} id="s_bottom" style={HANDLE_STYLE} />
      <Handle type="target" position={Position.Bottom} id="t_bottom" style={HANDLE_STYLE} />
    </div>
  );
}
