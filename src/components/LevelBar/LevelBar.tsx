import { cn } from "assets/lib/utils";
import { useTranslation } from "react-i18next";
import { getPointsToLvlUp } from "utils/gameLogic";

interface LevelInterfaceProps {
  points: number;
  lvl: number;
  currentLevelMaxPoints: number;
  size?: "default" | "mini";
  showBadge?: boolean;
  showStats?: boolean;
  showLabel?: boolean;
  className?: string; // Add className for external positioning
}

export const LevelBar = ({
  points,
  lvl,
  size = "default",
  showBadge = true,
  showStats = true,
  showLabel = true,
  className,
}: LevelInterfaceProps) => {
  const { t } = useTranslation("common");

  const levelXpStart = getPointsToLvlUp(lvl - 1);
  const levelXpEnd = getPointsToLvlUp(lvl);

  // Heuristic: If points are less than start XP, they are likely relative points (points within level)
  // rather than total lifetime xp. We adjust for this to show correct progress.
  let effectivePoints = points;
  if (points < levelXpStart && lvl > 1) {
    effectivePoints += levelXpStart;
  }

  const pointsInThisLevel = Math.max(0, effectivePoints - levelXpStart);
  const levelXpDifference = Math.max(1, levelXpEnd - levelXpStart);
  const progressPercent = Math.min(
    Math.max((pointsInThisLevel / levelXpDifference) * 100, 0),
    100
  );

  // Calculate segments (10 segments for better visual feedback)
  const totalSegments = 10;
  const filledSegments = Math.floor((progressPercent / 100) * totalSegments);
  const partialSegment = ((progressPercent / 100) * totalSegments) % 1;

  const isMini = size === "mini";

  return (
    <div className={cn("flex items-center gap-4", isMini && "gap-2", className)}>
      {/* Level Badge */}
      {showBadge && (
        <div
          className={cn(
            "flex items-center justify-center rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-cyan-600/30 shadow-lg",
            isMini ? "h-8 w-8" : "h-10 w-10"
          )}>
          <span
            className={cn(
              "font-bold text-white drop-shadow-sm",
              isMini ? "text-xs" : "text-sm"
            )}>
            {lvl}
          </span>
        </div>
      )}

      {/* Segmented Progress Bar */}
      <div className='flex flex-col gap-2'>
        {showLabel && (
          <div className={cn("flex items-center gap-2", isMini ? "text-xs" : "text-sm")}>
            <span className='font-semibold text-white'>Level {lvl}</span>
            <span className='font-bold text-cyan-400'>
              {Math.round(progressPercent)}%
            </span>
          </div>
        )}

        {/* Segments Container */}
        <div className={cn("flex", isMini ? "gap-0.5" : "gap-1")}>
          {Array.from({ length: totalSegments }, (_, index) => {
            let segmentFill = 0;

            if (index < filledSegments) {
              segmentFill = 100; // Fully filled
            } else if (index === filledSegments && partialSegment > 0) {
              segmentFill = partialSegment * 100; // Partially filled
            }

            return (
              <div
                key={index}
                className={cn(
                  "relative overflow-hidden rounded border border-zinc-600/30 bg-zinc-800/60",
                  isMini ? "h-2 w-3" : "h-3 w-8"
                )}>
                {/* Segment fill */}
                <div
                  className='h-full bg-gradient-to-b from-cyan-400 to-cyan-500 transition-all duration-700 ease-out'
                  style={{ width: `${segmentFill}%` }}>
                  {/* Subtle inner highlight */}
                  {segmentFill > 0 && (
                    <div className='absolute inset-0 bg-gradient-to-b from-white/20 to-transparent'></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        {showStats && (
          <div className={cn("text-white/80", isMini ? "text-xs" : "text-sm")}>
            <span>
              {pointsInThisLevel.toLocaleString()}/
              {levelXpDifference.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
