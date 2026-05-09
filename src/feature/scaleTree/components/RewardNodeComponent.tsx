import { useState, useRef, useCallback, useEffect } from "react";
import { Zap } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { RewardNodeDef } from "../types/scaleTree.types";
import { claimReward } from "../services/rewardService";

export type RewardNodeRFNode = Node<RewardNodeDef & { claimed?: boolean; userId?: string }, "rewardNode">;

export function RewardNodeComponent({ data, selected }: NodeProps<RewardNodeRFNode>) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [localClaimed, setLocalClaimed] = useState(data.claimed ?? false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isClaimed = localClaimed;

  // Sync with prop changes
  useEffect(() => {
    setLocalClaimed(data.claimed ?? false);
  }, [data.claimed]);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setShowTooltip(true), 280);
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setShowTooltip(false);
  };

  const handleClaim = useCallback(async () => {
    if (isClaimed || isClaiming || !data.userId) return;
    setIsClaiming(true);
    try {
      const result = await claimReward(
        data.userId,
        data.id,
        data.points,
        data.famePoints
      );
      if (result.success) {
        setLocalClaimed(true);
      } else {
        console.error("Failed to claim reward:", result.error);
      }
    } finally {
      setIsClaiming(false);
    }
  }, [isClaimed, isClaiming, data]);

  const size = 70;
  const containerSize = 100;

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{ width: containerSize + 20, position: "relative" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Handle type="target" position={Position.Top} id="t_top" style={{ opacity: 0, width: 4, height: 4, zIndex: 10 }} />
      <Handle type="source" position={Position.Top} id="s_top" style={{ opacity: 0, width: 4, height: 4, zIndex: 10 }} />

      {showTooltip && (
        <div
          style={{
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
            width: 220,
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 10,
              height: 10,
              background: "#0c0a09",
              borderRight: "1px solid #44403c",
              borderBottom: "1px solid #44403c",
            }}
          />

          <div style={{ fontWeight: 700, fontSize: 12, color: "#fbbf24", letterSpacing: "0.01em", marginBottom: 4 }}>
            ⭐ Reward Node
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: "#52525b" }}>Points</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#fbbf24" }}>+{data.points}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#52525b" }}>Fame</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#f97316" }}>+{data.famePoints}</span>
          </div>
          {isClaimed ? (
            <div style={{ fontSize: 9, color: "#10b981", fontWeight: 600, textAlign: "center" }}>
              ✓ Already Claimed
            </div>
          ) : (
            <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "center" }}>
              Click to claim reward
            </div>
          )}
        </div>
      )}

      <div
        style={{
          width: containerSize,
          height: containerSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          onClick={handleClaim}
          className={`relative flex items-center justify-center ${!isClaimed && !isClaiming ? "hover:scale-110 active:scale-90 cursor-pointer" : isClaimed ? "cursor-default" : "cursor-not-allowed"}`}
          style={{
            width: size,
            height: size,
            transition: "transform 0.12s",
            flexShrink: 0,
            filter: !isClaimed
              ? "drop-shadow(0 0 12px rgba(251,191,36,0.8))"
              : "drop-shadow(0 0 8px rgba(34,211,238,0.6))",
          }}
        >
          {/* Border */}
          <div
            style={{
              position: "absolute",
              width: size,
              height: size,
              background: !isClaimed ? "#fbbf24" : "#22d3ee",
              borderRadius: "50%",
              opacity: !isClaimed ? 1 : 0.6,
              pointerEvents: "none",
            }}
          />

          {/* Fill */}
          <div
            style={{
              position: "absolute",
              width: size - 4,
              height: size - 4,
              background: !isClaimed ? "#92400e" : "#164e63",
              borderRadius: "50%",
              opacity: 0.95,
              pointerEvents: "none",
            }}
          />

          {/* Inner accent glow */}
          {!isClaimed && (
            <div
              style={{
                position: "absolute",
                width: size - 6,
                height: size - 6,
                background: "radial-gradient(circle, rgba(251,191,36,0.3), transparent)",
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Content */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
            }}
          >
            {isClaimed ? "✓" : "⭐"}
          </div>
        </div>
      </div>

      {/* Label */}
      <div style={{ width: containerSize + 20, marginTop: 6, textAlign: "center" }}>
        <p className="text-[10px] font-bold text-amber-300 truncate px-1">
          {data.points} pts
        </p>
        <p className="text-[9px] text-orange-400 truncate px-1">
          {data.famePoints} fame
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} id="s_bottom" style={{ opacity: 0, width: 4, height: 4, zIndex: 10 }} />
      <Handle type="target" position={Position.Bottom} id="t_bottom" style={{ opacity: 0, width: 4, height: 4, zIndex: 10 }} />
    </div>
  );
}
