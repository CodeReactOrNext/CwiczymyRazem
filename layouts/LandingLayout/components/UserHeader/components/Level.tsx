import { useTranslation } from "react-i18next";

interface LevelInterfaceProps {
  points: number;
  lvl: number;
  pointsToNextLvl: number;
}

export const Level = ({
  points,
  lvl,
  pointsToNextLvl,
}: LevelInterfaceProps) => {
  const { t } = useTranslation("landing");
  return (
    <div className='col-span-2 flex flex-col items-center md:col-auto lg:w-64 lg:justify-self-end xl:w-80'>
      <p>
        {t("your_level")} <span className='text-4xl text-mainText'>{lvl}</span>
      </p>
      <div className=' flex w-full'>
        <p className=' relative left-3 z-10 text-sm'>
          {t("lvl_short")}
          <span className='text-xl text-mainText'>{lvl}</span>
        </p>
        <div className='relative flex h-4 w-full items-center bg-main-opposed'>
          <div className='relative h-5 w-[20%] bg-main'></div>
        </div>
        <p className='relative right-3 text-sm'>
          {t("lvl_short")}
          <span className='text-xl  text-mainText'>{lvl + 1}</span>
        </p>
      </div>
      <p>
        {points}/{pointsToNextLvl}
        {t("points_short")}
      </p>
    </div>
  );
};
