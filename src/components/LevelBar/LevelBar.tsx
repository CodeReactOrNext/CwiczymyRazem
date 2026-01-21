import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
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

  // Calculate segments (5 segments for better visual feedback)
  const totalSegments = 5;
  const filledSegments = Math.floor((progressPercent / 100) * totalSegments);
  const partialSegment = ((progressPercent / 100) * totalSegments) % 1;

  const isMini = size === "mini";

  return (
    <div className={cn("flex items-center gap-3 sm:gap-4", isMini && "gap-2", className)}>
      {/* Level Badge */}
      {showBadge && (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-cyan-600/30 shadow-lg",
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
      <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
        {showLabel && (
          <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5", isMini ? "text-[10px]" : "text-sm")}>
            {!showBadge && <span className='font-semibold text-white'>Level {lvl}</span>}
            <div className="flex items-center gap-1.5">
              <span className='font-bold text-cyan-400'>
                {Math.round(progressPercent)}% XP
              </span>
              <span className={cn("font-medium text-white/40", isMini ? "text-[9px]" : "text-xs")}>
                  ({pointsInThisLevel.toLocaleString()} / {levelXpDifference.toLocaleString()})
              </span>
            </div>
          </div>
        )}

        {/* Segments Container */}
        <div className={cn("flex items-center justify-between gap-1", !isMini && "sm:gap-1.5")}>
          {Array.from({ length: totalSegments }, (_, index) => {
            let segmentFill = 0;

            if (index < filledSegments) {
              segmentFill = 100; // Fully filled
            } else if (index === filledSegments && partialSegment > 0) {
              segmentFill = partialSegment * 100; // Partially filled
            }

            const isFilled = segmentFill > 0;

            return (
              <div
                key={index}
                className={cn(
                  "relative h-2.5 flex-1 overflow-hidden rounded-md border transition-all duration-500 shadow-inner sm:h-3.5",
                  isFilled ? "border-cyan-400/30 bg-zinc-900/40" : "border-white/5 bg-zinc-900/60"
                )}>
                {/* Segment fill with glow and premium gradient */}
                <div
                  className={cn(
                    'h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-500 transition-all duration-700 ease-out relative',
                    isFilled && "shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                  )}
                  style={{ width: `${segmentFill}%` }}>
                  {/* Glossy overlay */}
                  <div className='absolute inset-0 bg-gradient-to-b from-white/20 to-transparent'></div>
                  
                  {/* Active segment edge highlight */}
                  {segmentFill > 0 && segmentFill < 100 && (
                    <div className='absolute right-0 top-0 bottom-0 w-px bg-white/40 blur-[1px]'></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats - Hidden on mobile if redundant */}
        {showStats && !isMini && (
          <div className={cn("hidden text-white/80 sm:block", isMini ? "text-xs" : "text-sm")}>
            <span>
              {pointsInThisLevel.toLocaleString()} /{" "}
              {levelXpDifference.toLocaleString()} XP
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
