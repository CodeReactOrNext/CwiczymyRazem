import Image from "next/image";
import FireSVG from "public/static/images/svg/Fire";
import Lightning from "public/static/images/svg/Lightning";
import blackGuitar from "public/static/images/guitar_black.png";
import Button from "components/Button";
import LevelIndicator from "components/RatingPopUp/LevelIndicator";
import OldEffect from "components/OldEffect";
import BonusPointsItem from "./BonusPointsItem";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

export interface BonusPoints {
  timePoints?: number;
  additionalPoints?: number;
  streak?: number;
  habitsCount?: number;
  time?: string;
}
interface RatingPopUpProps {
  ratingData: {
    basePoints: number;
    currentLevel: number;
    bonusPoints?: BonusPoints[];
  };
  onClick: Dispatch<SetStateAction<boolean>>;
}

export default function RatingPopUp({
  ratingData: { basePoints, currentLevel, bonusPoints },
  onClick,
}: RatingPopUpProps) {
  const { t } = useTranslation("report");
  return (
    <div className='relative flex h-5/6 max-h-[1020px] w-[95%] translate-y-[10%] items-center justify-center bg-main-opposed-500 font-sans md:min-h-[700px] lg:aspect-square lg:w-auto'>
      <OldEffect className='absolute z-10' />
      <div className='absolute top-[20%] -left-[5%] right-0 flex w-[110%] items-center justify-center bg-main-500 text-5xl font-medium sm:text-8xl'>
        <p>
          {basePoints}
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
            }}>
            {t("rating_popup.back")}
          </Button>
          <div className='absolute -top-[170%] z-40 my-auto flex h-7 w-2/3 items-center md:-top-[130%] md:w-5/12'>
            <div className='h-4/5 w-full bg-second-500'></div>
            <div className={`absolute left-0 top-0 h-full w-[50%] bg-main-500`}>
              <p className='absolute -right-[18%] -top-[80%]  text-lg font-medium text-main-500 md:text-xl'>
                +{basePoints} {t("rating_popup.points")}
              </p>
            </div>
            <LevelIndicator position='left'>{currentLevel}</LevelIndicator>
            <LevelIndicator position='right'>{currentLevel + 1}</LevelIndicator>
          </div>
        </div>
      </div>
      <ul className='relative -mt-[10%] md:-ml-[20%]'>
        {bonusPoints?.map((data, index) => (
          <BonusPointsItem exerciseData={data} key={index} />
        ))}
      </ul>
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
}
