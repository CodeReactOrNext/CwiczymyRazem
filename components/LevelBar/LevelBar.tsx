import { useTranslation } from "react-i18next";
import { getPointsToLvlUp } from "utils/gameLogic/getPointsToLvlUp";

interface LevelInterfaceProps {
  points: number;
  lvl: number;
  currentLevelMaxPoints: number;
}
const LevelBar = ({
  points,
  lvl,
  currentLevelMaxPoints: pointsToNextLvl,
}: LevelInterfaceProps) => {
  const { t } = useTranslation("common");

  const levelXpStart = lvl === 1 ? 0 : getPointsToLvlUp(lvl - 1);
  const levelXpEnd = getPointsToLvlUp(lvl);
  const pointsInThisLevel = points - levelXpStart;
  const levelXpDifference = levelXpEnd - levelXpStart;
  const progressPercent = (pointsInThisLevel / levelXpDifference) * 100;

  return (
    <div className='col-span-2 m-auto flex w-[90%] flex-col items-center text-tertiary-400 md:col-auto lg:w-64 lg:justify-self-end xl:w-80 '>
      <p>
        {t("header.your_level")}{" "}
        <span className='text-4xl font-bold text-mainText'>{lvl}</span>
      </p>
      <div className=' flex w-full'>
        <p className=' relative left-3 z-10 text-sm'>
          {t("header.lvl_short")}
          <span className='text-xl  text-mainText'>{lvl}</span>
        </p>
        <div className='relative flex h-4 w-full items-center bg-main-opposed bg-opacity-80 radius-default'>
          <div
            className='relative h-5 bg-gradient-to-r from-main-600 to-main-200 radius-default '
            style={{ width: progressPercent + "%" }}></div>
        </div>
        <p className='relative right-3 text-sm'>
          {t("header.lvl_short")}
          <span className='text-xl  text-mainText'>{lvl + 1}</span>
        </p>
      </div>
      <p>
        {points}/{pointsToNextLvl}
        {t("header.points_short")}
      </p>
    </div>
  );
};

export default LevelBar;
