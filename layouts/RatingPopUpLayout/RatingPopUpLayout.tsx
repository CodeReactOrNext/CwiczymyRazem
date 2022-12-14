import Image from "next/image";
import FireSVG from "public/static/images/svg/Fire";
import Lightning from "public/static/images/svg/Lightning";
import blackGuitar from "public/static/images/guitar_black.png";
import Button from "components/Button";

import OldEffect from "components/OldEffect";
import BonusPointsItem from "./components/BonusPointsItem";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Router from "next/router";
import { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { motion } from "framer-motion";
import { StatisticsDataInterface } from "constants/userStatisticsInitialData";
import { calcExperience } from "utils/gameLogic/calcExperience";
import LevelIndicator from "./components/LevelIndicator";


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
  const [currentLevel, setCurrentLevel] = useState(previousUserStats.lvl);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentLevel(currentUserStats.lvl);
    }, 3100);

    return () => {
      clearTimeout(timeout);
    };
  }, [currentUserStats.lvl]);

  const { t } = useTranslation("report");
  const isGetNewLevel = currentUserStats.lvl > previousUserStats.lvl;
  const newAchievements = currentUserStats.achievements.filter(
    (x) => !previousUserStats.achievements.includes(x)
  );

  const leveledUp = () => {
    return previousUserStats.lvl !== currentUserStats.lvl;
  };

  const levelXpStart =
    currentUserStats.lvl === 1 ? 0 : calcExperience(currentUserStats.lvl - 1);
  const levelXpEnd = calcExperience(currentUserStats.lvl);

  const pointsInThisLevel = currentUserStats.points - levelXpStart;

  const levelXpDifference = levelXpEnd - levelXpStart;
  const prevProgressPercent =
    ((pointsInThisLevel - ratingData.basePoints) / levelXpDifference) * 100;

  const currProgressPercent = (pointsInThisLevel / levelXpDifference) * 100;

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
        <FireSVG className='absolute -bottom-10 -left-[10%] w-4/6 rotate-6 fill-second-500 md:bottom-auto' />
        <FireSVG className='absolute -bottom-10  -right-[10%] w-4/6 -rotate-6 fill-second-500 md:bottom-auto' />

        <div className='absolute bottom-0 flex h-1/3 w-full items-start justify-center'>
          <Button
            onClick={() => {
              onClick(false);
              Router.push("/");
            }}>
            {t("rating_popup.back")}
          </Button>
          <div className='absolute -top-[170%] z-40 my-auto flex h-7 w-2/3 items-center md:-top-[130%] md:w-5/12'>
            <div className='h-4/5 w-full bg-second-500 '>
              <motion.div
                initial={{
                  width: `${
                    !leveledUp()
                      ? prevProgressPercent
                      : previousUserStats.points === 0
                      ? 0
                      : 100
                  }%`,
                }}
                animate={{
                  width: `${currProgressPercent}%`,
                }}
                transition={{ duration: 2, delay: leveledUp() ? 3 : 1 }}
                className={`absolute left-0 top-0 h-full bg-main-500 bg-gradient-to-r from-main-700 to-main-300`}>
                <motion.p
                  initial={{ opacity: 0, y: 20, x: "50%" }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ease: "easeOut", duration: 0.3, delay: 0.9 }}
                  className='absolute right-0 -top-[80%] overflow-hidden whitespace-nowrap text-lg font-medium text-main-500 md:text-xl'>
                  +{ratingData.basePoints} {t("rating_popup.points")}
                </motion.p>
              </motion.div>
            </div>
            <LevelIndicator position='left'>{currentLevel}</LevelIndicator>
            <LevelIndicator position='right'>{currentLevel + 1}</LevelIndicator>
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
      <motion.div
        className='absolute -right-[25%] -top-[25%] z-10  h-5/6 w-[50%] -rotate-12 md:-right-[25%] md:-top-[5%]'
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, type: "tween" }}>
        <Lightning className='absolute -rotate-12 fill-tertiary-500' />
      </motion.div>
    </div>
  );
};

export default RatingPopUp;