import Image from "next/image";
import FireSVG from "public/static/images/svg/Fire";
import Lightning from "public/static/images/svg/Lightning";
import blackGuitar from "public/static/images/guitar_black.png";
import Button from "components/UI/Button";

import OldEffect from "components/OldEffect";
import BonusPointsItem from "./components/BonusPointsItem";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Router from "next/router";
import { ReportDataInterface } from "feature/user/view/ReportView/ReportView.types";
import { motion } from "framer-motion";
import { StatisticsDataInterface } from "types/api.types";
import { getPointsToLvlUp } from "utils/gameLogic/getPointsToLvlUp";
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
    currentUserStats.lvl === 1 ? 0 : getPointsToLvlUp(currentUserStats.lvl - 1);
  const levelXpEnd = getPointsToLvlUp(currentUserStats.lvl);

  const pointsInThisLevel = currentUserStats.points - levelXpStart;

  const levelXpDifference = levelXpEnd - levelXpStart;
  const prevProgressPercent =
    ((pointsInThisLevel - ratingData.totalPoints) / levelXpDifference) * 100;

  const currProgressPercent = (pointsInThisLevel / levelXpDifference) * 100;

  return (
    <div className='relative flex h-5/6 max-h-[1020px] min-h-[750px] w-[95%] translate-y-[10%] items-center justify-center bg-main-opposed-500 font-sans tracking-wider  md:min-h-[800px] lg:aspect-square lg:w-auto'>
      <OldEffect className='absolute z-10' />
      <div className='absolute  top-[20%] -left-[5%] right-0 flex w-[110%] items-center justify-center bg-main-500 text-5xl font-medium sm:text-8xl'>
        <p>
          {ratingData.totalPoints}
          {t("rating_popup.points")}
        </p>
      </div>
      <p className='absolute top-[5%] text-5xl font-medium text-tertiary-500 md:text-8xl'>
        {t("rating_popup.title")}
      </p>

      <div className='absolute right-0 left-0 bottom-0 z-10 h-[30%] max-h-[270px] w-full overflow-hidden  sm:h-[50%] md:max-h-[500px] '>
        <FireSVG className='absolute -bottom-10 -left-[10%] w-4/6 rotate-6 fill-second-500 md:bottom-auto' />
        <FireSVG className='absolute -bottom-10  -right-[10%] w-4/6 -rotate-6 fill-second-500 md:bottom-auto' />
        <div className='absolute bottom-0  h-12 w-full bg-second-500'></div>

        <div className='absolute bottom-0 flex h-1/4 w-full items-start justify-center'>
          <Button
            onClick={() => {
              onClick(false);
              Router.push("/");
            }}>
            {t("rating_popup.back")}
          </Button>
          <div className='absolute -top-[230%] z-40 my-auto flex h-7 w-2/5 items-center md:-top-[130%] md:w-5/12'>
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
                  className='absolute right-0 -top-[80%] overflow-hidden whitespace-nowrap text-lg font-medium text-second-text md:text-xl'>
                  +{ratingData.totalPoints} {t("rating_popup.points")}
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

      <div className='absolute -bottom-[15%] -left-[27%] z-40 w-[50%] sm:-left-[15%] md:-bottom-[5%] md:-left-[10%] md:w-auto'>
        <Image
          src={blackGuitar}
          height={705}
          width={254}
          objectFit='contain'
          alt=''></Image>
      </div>
      <motion.div
        className='absolute -right-[25%] -top-[25%] z-10  h-5/6 w-[50%] -rotate-12 md:-top-[5%] lg:-right-[25%]'
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, type: "tween" }}>
        <Lightning className='absolute -rotate-12 fill-tertiary-500' />
      </motion.div>
    </div>
  );
};

export default RatingPopUp;
