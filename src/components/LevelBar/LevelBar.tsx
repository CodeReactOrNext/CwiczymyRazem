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
  const progressPercent = (pointsInThisLevel / levelXpDifference) * 100;

  return (
    <div className='relative z-30 flex w-full flex-col items-center text-lg text-tertiary-400 sm:text-xl md:w-52 lg:w-64 lg:justify-self-end xl:w-80 '>
      <p>
        {t("header.your_level")}{" "}
        <span className='text-3xl font-bold text-mainText sm:text-4xl'>
          {lvl}
        </span>
      </p>
      <div className=' flex w-full'>
        <div className='relative  flex h-3 w-full items-center bg-main-opposed bg-opacity-80  radius-default'>
          <div
            className='relative h-3 bg-gradient-to-r from-main-600 to-main-200 shadow-[0_0_15px_rgba(255,0,0,0.2)] drop-shadow-lg 
                     radius-default '
            style={{ width: progressPercent + "%" }}></div>
        </div>
      </div>
      <p className='mt-2 !font-semibold text-mainText'>
        {points - levelXpStart}/{levelXpEnd - levelXpStart}
        <span className='text-sm'> {t("header.points_short")}</span>
      </p>
    </div>
  );
};
