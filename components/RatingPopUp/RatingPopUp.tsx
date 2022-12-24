import Image from "next/image";
import FireSVG from "public/static/images/svg/Fire";
import Lightning from "public/static/images/svg/Lightning";
import blackGuitar from "public/static/images/guitar_black.png";
import Button from "components/Button";
import LevelIndicator from "components/RatingPopUp/components/LevelIndicator";
import OldEffect from "components/OldEffect";
import BonusPointsItem from "./components/BonusPointsItem";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import Router from "next/router";
import { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";

export interface BonusPointsInterface {
  timePoints: number;
  additionalPoints: number;
  habitsCount: number;
  time: number;
  multiplier: number;
}
interface RatingPopUpProps {
  ratingData: ReportDataInterface;
  currentUserStats: StatisticsDataInterface;
  previousUserStats: StatisticsDataInterface;
  onClick: Dispatch<SetStateAction<boolean>>;
}

const RatingPopUp = ({
  ratingData,
  currentUserStats,
  previousUserStats,
  onClick,
}: RatingPopUpProps) => {
  const { t } = useTranslation("report");
  const isGetNewLevel = currentUserStats.lvl > previousUserStats.lvl;
  const newAchievements = currentUserStats.achievements.filter(
    (x) => !previousUserStats.achievements.includes(x)
  );

  return (
    <div className='relative flex h-5/6 max-h-[1020px] w-[95%] translate-y-[10%] items-center justify-center bg-main-opposed-500 font-sans md:min-h-[700px] lg:aspect-square lg:w-auto'>
      <OldEffect className='absolute z-10' />
      <div className='absolute top-[20%] -left-[5%] right-0 flex w-[110%] items-center justify-center bg-main-500 text-5xl font-medium sm:text-8xl'>
        <p>
          {ratingData.basePoints}
          {t("rating_popup.points")}
        </p>
      </div>
      <p className='absolute top-[5%] text-5xl font-medium text-tertiary-500 md:text-8xl'>
        {t("rating_popup.title")}
      </p>
      <div className='absolute right-0 left-0 bottom-0 z-10 h-[40%] w-full overflow-hidden sm:h-[50%] md:h-[55%]'>
        <FireSVG className='absolute bottom-0 -left-[10%] w-4/6 rotate-6 fill-second-500 md:bottom-auto' />
        <FireSVG className='absolute bottom-0 -right-[10%] w-4/6 -rotate-6  fill-second-500 md:bottom-auto' />
        <div className='absolute bottom-0 flex h-1/3 w-full items-start justify-center bg-second-500'>
          <Button
            onClick={() => {
              onClick(false);
              Router.push("/");
            }}>
            {t("rating_popup.back")}
          </Button>
          <div className='absolute -top-[170%] z-40 my-auto flex h-7 w-2/3 items-center md:-top-[130%] md:w-5/12'>
            <div className='h-4/5 w-full bg-second-500'></div>
            <div className={`absolute left-0 top-0 h-full w-[50%] bg-main-500`}>
              <p className='absolute -right-[18%] -top-[80%]  text-lg font-medium text-main-500 md:text-xl'>
                +{ratingData.basePoints} {t("rating_popup.points")}
              </p>
            </div>
            <LevelIndicator position='left'>
              {currentUserStats.lvl}
            </LevelIndicator>
            <LevelIndicator position='right'>
              {currentUserStats.lvl + 1}
            </LevelIndicator>
          </div>
        </div>
      </div>

      <BonusPointsItem
        bonusPoints={ratingData.bonusPoints}
        actualDayWithoutBreak={currentUserStats.actualDayWithoutBreak}
        achievements={newAchievements}
        isGetNewLevel={isGetNewLevel}
      />

      <div className='absolute -bottom-[10%] -left-[25%] z-40 w-[50%] sm:-left-[15%] md:-bottom-[5%] md:-left-[10%] md:w-auto'>
        <Image
          src={blackGuitar}
          height={705}
          width={254}
          objectFit='contain'
          alt='black guitar'></Image>
      </div>
      <Lightning className='absolute -right-[25%] -top-[25%] z-10 h-5/6 w-[50%] -rotate-12 fill-tertiary-500 md:-right-[25%] md:-top-[5%]' />
    </div>
  );
};

export default RatingPopUp;
