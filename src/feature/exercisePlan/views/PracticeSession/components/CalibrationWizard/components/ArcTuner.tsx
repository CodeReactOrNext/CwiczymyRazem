import React from "react";

import { CX, CY, MAX_ANGLE_DEG, NEEDLE_LEN, R, arcPt } from "../calibration.constants";

export const ArcTuner = React.memo(function ArcTuner({
  cents,
  hasNote,
}: {
  cents:   number;
  hasNote: boolean;
}) {
  const clamped  = Math.max(-50, Math.min(50, cents));
  const angle    = (clamped / 50) * MAX_ANGLE_DEG;
  const abs      = Math.abs(clamped);
  const isInTune = hasNote && abs < 10;
  const isClose  = hasNote && abs < 25;
  const color    = !hasNote ? "#52525b" : isInTune ? "#10b981" : isClose ? "#f59e0b" : "#ef4444";

  // Green zone: ±12¢ → ±(12/50)*80 ≈ ±19.2°
  const [gx1, gy1] = arcPt(-19.2);
  const [gx2, gy2] = arcPt(19.2);

  return (
    <svg viewBox="0 0 280 160" className="w-full select-none" aria-hidden>
      {/* Track */}
      <path
        d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
        fill="none" stroke="#1c1c1f" strokeWidth="10" strokeLinecap="round"
      />
      {/* Green zone */}
      <path
        d={`M ${gx1.toFixed(1)} ${gy1.toFixed(1)} A ${R} ${R} 0 0 1 ${gx2.toFixed(1)} ${gy2.toFixed(1)}`}
        fill="none" stroke="#059669" strokeWidth="10" strokeLinecap="round"
        style={{ opacity: isInTune ? 0.9 : 0.25, transition: "opacity 0.3s" }}
      />
      {/* Tick marks */}
      {([-80, -40, 0, 40, 80] as const).map((deg) => {
        const [ox, oy] = arcPt(deg, R);
        const [ix, iy] = arcPt(deg, R - 13);
        return (
          <line key={deg}
            x1={ox} y1={oy} x2={ix} y2={iy}
            stroke={deg === 0 ? "#52525b" : "#2a2a2e"}
            strokeWidth={deg === 0 ? 2.5 : 1.5} strokeLinecap="round"
          />
        );
      })}
      {/* Needle */}
      <g style={{
        transform: `rotate(${angle}deg)`,
        transformOrigin: `${CX}px ${CY}px`,
        transition: hasNote ? "transform 0.08s ease-out" : "none",
      }}>
        <line x1={CX} y1={CY} x2={CX} y2={CY - NEEDLE_LEN}
          strokeWidth="2.5" strokeLinecap="round"
          stroke={color} style={{ transition: "stroke 0.2s" }}
        />
        <circle cx={CX} cy={CY - NEEDLE_LEN} r="4" fill={color} style={{ transition: "fill 0.2s" }} />
      </g>
      {/* Pivot */}
      <circle cx={CX} cy={CY} r="6" fill={color} style={{ transition: "fill 0.2s" }} />
      {/* Glow ring when in tune */}
      {isInTune && (
        <circle cx={CX} cy={CY} r="12" fill="none"
          stroke="#10b981" strokeWidth="1.5" opacity="0.35"
          style={{ animation: "pulse 1.5s ease-in-out infinite" }}
        />
      )}
    </svg>
  );
});
