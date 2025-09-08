import { useTranslation } from "react-i18next";
import { getPointsToLvlUp } from "utils/gameLogic";

interface LevelInterfaceProps {
  points: number;
  lvl: number;
  currentLevelMaxPoints: number;
}

export const LevelBar = ({ points, lvl }: LevelInterfaceProps) => {
  const { t } = useTranslation("common");

  const levelXpStart = getPointsToLvlUp(lvl - 1);
  const levelXpEnd = getPointsToLvlUp(lvl);
  const pointsInThisLevel = points - levelXpStart;
  const levelXpDifference = levelXpEnd - levelXpStart;
  const progressPercent = Math.min(
    (pointsInThisLevel / levelXpDifference) * 100,
    100
  );

  // Calculate segments (10 segments for better visual feedback)
  const totalSegments = 10;
  const filledSegments = Math.floor((progressPercent / 100) * totalSegments);
  const partialSegment = ((progressPercent / 100) * totalSegments) % 1;

  return (
    <div className='flex items-center gap-4'>
      {/* Level Badge */}
      <div className='flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-cyan-600/30 shadow-lg'>
        <span className='text-sm font-bold text-white drop-shadow-sm'>
          {lvl}
        </span>
      </div>

      {/* Segmented Progress Bar */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2 text-sm'>
          <span className='font-semibold text-white'>Level {lvl}</span>
          <span className='font-bold text-cyan-400'>
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Segments Container */}
        <div className='flex gap-1'>
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
                className='relative h-3 w-8 overflow-hidden rounded border border-zinc-600/30 bg-zinc-800/60'>
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
        <div className='text-sm text-white/80'>
          <span>
            {pointsInThisLevel.toLocaleString()}/
            {levelXpDifference.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
