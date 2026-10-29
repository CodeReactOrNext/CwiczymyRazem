import { cn } from "assets/lib/utils";
import { useId } from "react";
import { getPointsToLvlUp } from "utils/gameLogic";

interface LevelProgressCircleProps {
  lvl: number;
  points: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export const LevelProgressCircle = ({
  lvl,
  points,
  size,
  showLabel = true,
  className = "",
}: LevelProgressCircleProps) => {
  const lvlXpStart = getPointsToLvlUp(lvl - 1);
  const lvlXpEnd = getPointsToLvlUp(lvl);
  
  let effectivePts = points;
  if (points < lvlXpStart && lvl > 1) effectivePts += lvlXpStart;
  
  const ptsInLevel = Math.max(0, effectivePts - lvlXpStart);
  const lvlRange = Math.max(1, lvlXpEnd - lvlXpStart);
  const xpPercent = Math.min(Math.max((ptsInLevel / lvlRange) * 100, 0), 100);
  
  const arcR = 38;
  const arcC = 2 * Math.PI * arcR;
  const arcOffset = arcC * (1 - xpPercent / 100);

  const finalSize = size || 100;
  // Per instance: the dashboard renders one ring for phones and one for
  // desktop, and a shared id would point both at whichever defs come first —
  // gradients inside a display:none copy do not paint.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `lvlArcGrad-${uid}`;
  const glowId = `lvlGlow-${uid}`;

  return (
    <div className={`relative flex flex-col items-center gap-1 ${className}`}>
      <div className="relative">
        <svg
          width={finalSize}
          height={finalSize}
          viewBox="0 0 100 100"
          className={cn("relative shrink-0", !size && "md:w-[120px] md:h-[120px]")}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="50" cy="50" r="46" fill="rgba(0,0,0,0.45)" />
          <circle cx="50" cy="50" r={arcR} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r={arcR}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={arcC}
            strokeDashoffset={arcOffset}
            transform="rotate(-90 50 50)"
            filter={`url(#${glowId})`}
          />
          <text
            x="50"
            y="51"
            textAnchor="middle"
            fill="white"
            fontSize="24"
            fontWeight="900"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            {lvl}
          </text>
          <text
            x="50"
            y="69"
            textAnchor="middle"
            fill="#67e8f9"
            fontSize="15"
            fontWeight="700"
            letterSpacing="2"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            LVL
          </text>
        </svg>
      </div>
      {showLabel && (
        <div className="hidden md:flex flex-col items-center gap-0.5">
          <span className="text-[11px] font-semibold tracking-[0.1em] text-zinc-400">Level {lvl} XP</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs tabular-nums text-zinc-400">
              {ptsInLevel.toLocaleString()} / {lvlRange.toLocaleString()}
            </span>
            <img src="/images/points.png" alt="points" className="h-5 w-5 object-contain opacity-80" />
          </div>
        </div>
      )}
    </div>
  );
};

