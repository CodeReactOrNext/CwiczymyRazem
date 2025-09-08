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

  return (
    <div className='flex w-full items-center gap-3 rounded-lg bg-white/5 px-3 py-2 transition-all duration-200 hover:bg-white/10'>
      {/* Compact Level Badge */}
      <div className='flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-sm font-bold text-white'>
        {lvl}
      </div>

      {/* Progress Bar */}
      <div className='flex-1'>
        <div className='mb-1 flex items-center justify-between text-xs'>
          <span className='text-white/80'>Level {lvl}</span>
          <span className='text-white/60'>{Math.round(progressPercent)}%</span>
        </div>
        <div className='h-1.5 w-full overflow-hidden rounded-full bg-white/10'>
          <div
            className='h-full rounded-full bg-white/60 transition-all duration-500'
            style={{ width: progressPercent + "%" }}></div>
        </div>
      </div>

      {/* Compact Stats */}
      <div className='text-right text-xs text-white/70'>
        <div className='font-medium'>
          {pointsInThisLevel}/{levelXpDifference}
        </div>
        <div className='text-white/50'>{levelXpEnd - points} to go</div>
      </div>
    </div>
  );
};
